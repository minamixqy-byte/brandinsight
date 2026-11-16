from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException, UploadFile
from openpyxl import load_workbook

from .config import MAX_UPLOAD_BYTES, SANDBOX_DATASET, UPLOAD_DIR
from .database import db_session


FIELD_LABELS = {
    "platform": "平台",
    "content_type": "内容类型",
    "original_text": "原文",
    "source_record_id": "原始编号",
    "source_url": "来源",
    "published_at_raw": "日期",
    "theme": "主题",
    "sentiment": "情感",
}
REQUIRED_FIELDS = ("platform", "content_type", "original_text")
HEADER_ALIASES = {
    "platform": {"平台", "platform", "渠道"},
    "content_type": {"内容类型", "content_type", "类型", "来源类型"},
    "original_text": {"原文", "反馈原文", "original_text", "正文", "内容"},
    "source_record_id": {"原始编号", "记录编号", "证据编号", "source_record_id", "id"},
    "source_url": {"来源", "来源入口", "原页面链接", "source_url", "url", "链接"},
    "published_at_raw": {"日期", "时间", "发布时间", "published_at", "published_at_raw"},
    "theme": {"主题", "标签", "theme"},
    "sentiment": {"情感", "情绪", "sentiment"},
}


@dataclass
class ParsedFile:
    headers: list[str]
    rows: list[dict[str, Any]]
    sheets: list[str]
    selected_sheet: str | None
    encoding: str | None


def safe_original_name(name: str | None) -> str:
    raw = Path(name or "upload").name
    clean = re.sub(r"[^\w.\-\u4e00-\u9fff]", "_", raw, flags=re.UNICODE)
    return clean[:160] or "upload"


def file_kind(name: str) -> str:
    suffix = Path(name).suffix.lower()
    if suffix == ".csv":
        return "csv"
    if suffix == ".xlsx":
        return "xlsx"
    raise HTTPException(status_code=415, detail={"code": "unsupported_file_type", "message": "仅支持 CSV 或 XLSX 文件"})


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


async def save_upload(upload: UploadFile) -> dict[str, Any]:
    original_name = safe_original_name(upload.filename)
    kind = file_kind(original_name)
    token = uuid.uuid4().hex
    batch_dir = UPLOAD_DIR / token
    batch_dir.mkdir(parents=True, exist_ok=False)
    stored_path = batch_dir / f"original.{kind}"
    total = 0
    try:
        with stored_path.open("wb") as output:
            while chunk := await upload.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail={"code": "file_too_large", "message": "文件超过 20 MB 限制"},
                    )
                output.write(chunk)
    except Exception:
        shutil.rmtree(batch_dir, ignore_errors=True)
        raise
    return {
        "token": token,
        "original_name": original_name,
        "kind": kind,
        "stored_path": stored_path,
        "file_size": total,
        "file_hash": file_hash(stored_path),
    }


def _decode_csv(path: Path) -> tuple[str, str]:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "gb18030"):
        try:
            return raw.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    raise ValueError("CSV 不是 UTF-8、UTF-8 BOM 或 GB18030 编码")


def parse_file(path: Path, kind: str, sheet: str | None = None) -> ParsedFile:
    if kind == "csv":
        text, encoding = _decode_csv(path)
        sample = text[:4096]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
        except csv.Error:
            dialect = csv.excel
        reader = csv.reader(io.StringIO(text), dialect)
        raw_rows = list(reader)
        if not raw_rows:
            raise ValueError("CSV 没有可读取的行")
        headers = [str(value).strip() for value in raw_rows[0]]
        rows = [
            {headers[index]: value for index, value in enumerate(row) if index < len(headers)}
            for row in raw_rows[1:]
        ]
        return ParsedFile(headers=headers, rows=rows, sheets=[], selected_sheet=None, encoding=encoding)

    try:
        workbook = load_workbook(path, read_only=True, data_only=True)
    except Exception as exc:
        raise ValueError(f"XLSX 无法读取：{exc}") from exc
    sheets = workbook.sheetnames
    if not sheets:
        raise ValueError("XLSX 没有工作表")
    selected = sheet or sheets[0]
    if selected not in sheets:
        raise ValueError("所选 Sheet 不存在")
    worksheet = workbook[selected]
    iterator = worksheet.iter_rows(values_only=True)
    try:
        first = next(iterator)
    except StopIteration as exc:
        raise ValueError("所选 Sheet 没有可读取的行") from exc
    headers = [str(value).strip() if value is not None else "" for value in first]
    rows = [
        {headers[index]: value for index, value in enumerate(values) if index < len(headers)}
        for values in iterator
    ]
    workbook.close()
    return ParsedFile(headers=headers, rows=rows, sheets=sheets, selected_sheet=selected, encoding=None)


def suggest_mapping(headers: list[str]) -> dict[str, str]:
    result: dict[str, str] = {}
    normalized = {header.strip().lower(): header for header in headers if header.strip()}
    for field, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            if alias.lower() in normalized:
                result[field] = normalized[alias.lower()]
                break
    return result


def is_blank_row(row: dict[str, Any]) -> bool:
    return not any(value is not None and str(value).strip() for value in row.values())


def valid_http_url(value: str) -> bool:
    if not value:
        return True
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def stable_record_id(platform: str, content_type: str, original_text: str) -> str:
    value = "\u241f".join((platform.strip(), content_type.strip(), original_text.strip()))
    return "SND_" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16].upper()


def validate_parsed(parsed: ParsedFile, mapping: dict[str, str], existing: dict[str, str]) -> dict[str, Any]:
    issues: list[dict[str, Any]] = []
    for field in REQUIRED_FIELDS:
        column = mapping.get(field)
        if not column or column not in parsed.headers:
            issues.append({
                "severity": "blocking",
                "code": "missing_mapping",
                "field": field,
                "message": f"请映射必填字段：{FIELD_LABELS[field]}",
            })
    if any(issue["code"] == "missing_mapping" for issue in issues):
        return {"issues": issues, "valid_rows": [], "summary": {"total": len(parsed.rows), "valid": 0, "blank": 0, "duplicates": 0, "conflicts": 0}}

    seen: dict[str, str] = {}
    valid_rows: list[dict[str, Any]] = []
    blank_count = 0
    duplicate_count = 0
    conflict_count = 0

    for offset, raw in enumerate(parsed.rows, start=2):
        if is_blank_row(raw):
            blank_count += 1
            issues.append({"severity": "warning", "code": "blank_row", "row": offset, "message": "空行将跳过"})
            continue
        values = {field: str(raw.get(column, "") or "").strip() for field, column in mapping.items() if column}
        missing = [field for field in REQUIRED_FIELDS if not values.get(field)]
        if missing:
            issues.append({
                "severity": "blocking",
                "code": "missing_required_value",
                "row": offset,
                "fields": missing,
                "message": f"第 {offset} 行缺少：{'、'.join(FIELD_LABELS[field] for field in missing)}",
            })
            continue
        url = values.get("source_url", "")
        if not valid_http_url(url):
            issues.append({
                "severity": "blocking",
                "code": "invalid_url",
                "row": offset,
                "field": "source_url",
                "message": f"第 {offset} 行来源仅允许 HTTP(S) 地址",
            })
            continue
        record_id = values.get("source_record_id") or stable_record_id(values["platform"], values["content_type"], values["original_text"])
        values["record_id"] = record_id
        values["source_row"] = offset
        if record_id in seen:
            if seen[record_id] == values["original_text"]:
                duplicate_count += 1
                issues.append({"severity": "warning", "code": "duplicate_in_file", "row": offset, "record_id": record_id, "message": "文件内重复记录将跳过"})
            else:
                conflict_count += 1
                issues.append({"severity": "blocking", "code": "conflict_in_file", "row": offset, "record_id": record_id, "message": "文件内相同编号对应不同原文"})
            continue
        seen[record_id] = values["original_text"]
        if record_id in existing:
            if existing[record_id] == values["original_text"]:
                duplicate_count += 1
                values["duplicate"] = True
            else:
                conflict_count += 1
                issues.append({"severity": "blocking", "code": "existing_id_conflict", "row": offset, "record_id": record_id, "message": "试验数据集中已有相同编号，但原文不同"})
                continue
        valid_rows.append(values)

    return {
        "issues": issues,
        "valid_rows": valid_rows,
        "summary": {
            "total": len(parsed.rows),
            "valid": len(valid_rows),
            "blank": blank_count,
            "duplicates": duplicate_count,
            "conflicts": conflict_count,
        },
    }


def batch_from_db(token: str) -> dict[str, Any]:
    with db_session() as db:
        row = db.execute("SELECT * FROM import_batches WHERE token = ?", (token,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail={"code": "import_not_found", "message": "导入预览已不存在"})
    return dict(row)


def existing_sandbox_records() -> dict[str, str]:
    with db_session() as db:
        rows = db.execute("SELECT record_id, original_text FROM records WHERE dataset_id = ?", (SANDBOX_DATASET,)).fetchall()
    return {row["record_id"]: row["original_text"] for row in rows}


def preview_payload(batch: dict[str, Any], parsed: ParsedFile) -> dict[str, Any]:
    mapping = suggest_mapping(parsed.headers)
    validation = validate_parsed(parsed, mapping, existing_sandbox_records())
    return {
        "token": batch["token"],
        "original_name": batch["original_name"],
        "file_type": batch["file_type"],
        "file_size": batch["file_size"],
        "sheets": parsed.sheets,
        "selected_sheet": parsed.selected_sheet,
        "headers": parsed.headers,
        "mapping": mapping,
        "preview": parsed.rows[:20],
        "encoding": parsed.encoding,
        "validation": {"issues": validation["issues"][:100], "summary": validation["summary"], "has_blocking": any(issue["severity"] == "blocking" for issue in validation["issues"])},
    }


def validate_batch(token: str, mapping: dict[str, str], sheet: str | None) -> dict[str, Any]:
    batch = batch_from_db(token)
    parsed = parse_file(Path(batch["stored_path"]), batch["file_type"], sheet)
    validation = validate_parsed(parsed, mapping, existing_sandbox_records())
    with db_session() as db:
        db.execute(
            "UPDATE import_batches SET selected_sheet=?, mapping_json=?, status='validated', total_rows=?, conflict_rows=?, error_json=? WHERE token=?",
            (
                parsed.selected_sheet,
                json.dumps(mapping, ensure_ascii=False),
                len(parsed.rows),
                validation["summary"]["conflicts"],
                json.dumps(validation["issues"], ensure_ascii=False),
                token,
            ),
        )
    return {
        "token": token,
        "headers": parsed.headers,
        "preview": parsed.rows[:20],
        "selected_sheet": parsed.selected_sheet,
        "mapping": mapping,
        "issues": validation["issues"][:200],
        "summary": validation["summary"],
        "has_blocking": any(issue["severity"] == "blocking" for issue in validation["issues"]),
    }


def commit_batch(token: str) -> dict[str, Any]:
    batch = batch_from_db(token)
    if batch["status"] == "committed":
        return {
            "token": token,
            "status": "committed",
            "inserted": batch["inserted_rows"],
            "skipped": batch["skipped_rows"],
            "conflicts": batch["conflict_rows"],
            "idempotent_replay": True,
        }
    mapping = json.loads(batch["mapping_json"] or "{}")
    if not mapping:
        raise HTTPException(status_code=409, detail={"code": "not_validated", "message": "请先确认字段映射"})
    parsed = parse_file(Path(batch["stored_path"]), batch["file_type"], batch["selected_sheet"])
    validation = validate_parsed(parsed, mapping, existing_sandbox_records())
    blocking = [issue for issue in validation["issues"] if issue["severity"] == "blocking"]
    if blocking:
        raise HTTPException(status_code=422, detail={"code": "blocking_validation_errors", "message": "存在阻断错误，未写入任何记录", "issues": blocking[:100]})

    inserted = 0
    skipped = 0
    inserted_ids: list[str] = []
    try:
        with db_session() as db:
            for row in validation["valid_rows"]:
                if row.get("duplicate"):
                    skipped += 1
                    continue
                cursor = db.execute(
                    """INSERT OR IGNORE INTO records(
                        dataset_id, record_id, source_record_id, platform, content_type, original_text,
                        clean_text, theme, sentiment, published_at_raw, source_url, source_file,
                        source_sheet, source_row, metadata_status
                      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        SANDBOX_DATASET,
                        row["record_id"],
                        row.get("source_record_id") or None,
                        row["platform"],
                        row["content_type"],
                        row["original_text"],
                        row["original_text"],
                        row.get("theme") or None,
                        row.get("sentiment") or None,
                        row.get("published_at_raw") or None,
                        row.get("source_url") or None,
                        batch["original_name"],
                        parsed.selected_sheet,
                        row["source_row"],
                        "complete" if row.get("published_at_raw") else "partial",
                    ),
                )
                if cursor.rowcount:
                    inserted += 1
                    inserted_ids.append(row["record_id"])
                else:
                    skipped += 1
            db.execute(
                """UPDATE import_batches SET status='committed', inserted_rows=?, skipped_rows=?,
                   conflict_rows=0, committed_at=CURRENT_TIMESTAMP WHERE token=?""",
                (inserted, skipped, token),
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"code": "commit_failed", "message": f"导入事务失败，未写入：{exc}"}) from exc

    return {
        "token": token,
        "status": "committed",
        "inserted": inserted,
        "skipped": skipped,
        "conflicts": 0,
        "inserted_ids": inserted_ids,
        "idempotent_replay": False,
    }

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from .config import CASE_DATASET, DB_PATH, DEMO_DIR, SOURCE_DIR
from .content import CLAIMS, COMPARISONS, FIXED_ANALYTICS, RECOMMENDATIONS
from .database import db_session, init_db


WORKBOOK_NAME = "小露珠_数据整理总表.xlsx"
EVIDENCE_CSV_NAME = "网页文案证据.csv"
REQUIRED_SHEETS = ["统一明细表", "官网产品信息", "样本量说明", "统计结果", "评论证据"]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", "", str(value)).replace("，", ",").replace("：", ":")


def display_value(value: Any) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value).strip()


def read_evidence_csv(path: Path) -> list[dict[str, str]]:
    raw = path.read_bytes()
    decoded = None
    encoding = None
    for candidate in ("utf-8-sig", "gb18030"):
        try:
            decoded = raw.decode(candidate)
            encoding = candidate
            break
        except UnicodeDecodeError:
            continue
    if decoded is None:
        raise ValueError("证据 CSV 不是 UTF-8、UTF-8 BOM 或 GB18030 编码")
    reader = csv.DictReader(decoded.splitlines())
    rows = [{str(key).strip(): (value or "").strip() for key, value in row.items()} for row in reader]
    for row in rows:
        row["_encoding"] = encoding or "unknown"
    return rows


def seed_database(db_path: Path = DB_PATH) -> dict[str, Any]:
    workbook_path = SOURCE_DIR / WORKBOOK_NAME
    evidence_path = SOURCE_DIR / EVIDENCE_CSV_NAME
    missing_files = [path.name for path in (workbook_path, evidence_path) if not path.exists()]
    if missing_files:
        audit = {
            "status": "missing_inputs",
            "missing_files": missing_files,
            "required_sheets": REQUIRED_SHEETS,
        }
        DEMO_DIR.mkdir(parents=True, exist_ok=True)
        (DEMO_DIR / "import-audit.json").write_text(
            json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return audit

    init_db(db_path)
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    missing_sheets = [name for name in REQUIRED_SHEETS if name not in workbook.sheetnames]
    if missing_sheets:
        raise ValueError(f"总表缺少工作表：{', '.join(missing_sheets)}")

    unified = workbook["统一明细表"]
    headers = [str(cell.value).strip() if cell.value is not None else "" for cell in unified[1]]
    header_index = {name: index for index, name in enumerate(headers)}
    required_columns = ["记录编号", "平台", "内容类型", "原文", "来源入口"]
    missing_columns = [name for name in required_columns if name not in header_index]
    if missing_columns:
        raise ValueError(f"统一明细表缺少字段：{', '.join(missing_columns)}")

    platform_types: Counter[tuple[str, str]] = Counter()
    missing_dates: Counter[str] = Counter()
    missing_tags: Counter[str] = Counter()
    missing_sentiment: Counter[str] = Counter()
    canonical_records: dict[str, dict[str, Any]] = {}
    normalized_lookup: defaultdict[str, list[str]] = defaultdict(list)
    source_url_lookup: defaultdict[str, list[str]] = defaultdict(list)
    record_rows: list[tuple[Any, ...]] = []

    for excel_row, values in enumerate(unified.iter_rows(min_row=2, values_only=True), start=2):
        row = {name: values[index] if index < len(values) else None for name, index in header_index.items()}
        record_id = display_value(row.get("记录编号"))
        if not record_id:
            continue
        platform = display_value(row.get("平台")) or "未知"
        content_type = display_value(row.get("内容类型")) or "未知"
        original_text = display_value(row.get("原文")) or ""
        clean_text = display_value(row.get("清洗文本")) or original_text
        published_raw = display_value(row.get("时间"))
        theme = display_value(row.get("主题"))
        sentiment = display_value(row.get("情感"))
        source_url = display_value(row.get("来源入口"))
        metadata_status = "complete"
        if not published_raw or not theme:
            metadata_status = "partial"
        platform_types[(platform, content_type)] += 1
        if not published_raw:
            missing_dates[platform] += 1
        if not theme:
            missing_tags[platform] += 1
        if not sentiment:
            missing_sentiment[platform] += 1
        payload = {
            "dataset_id": CASE_DATASET,
            "record_id": record_id,
            "source_record_id": record_id,
            "platform": platform,
            "source_type": display_value(row.get("来源类型")),
            "content_type": content_type,
            "product_name": display_value(row.get("产品名_统一")),
            "author_type": None,
            "original_text": original_text,
            "clean_text": clean_text,
            "substantive": row.get("实质文本") if isinstance(row.get("实质文本"), int) else None,
            "theme": theme,
            "sentiment": sentiment,
            "published_at_raw": published_raw,
            "published_at": None,
            "collected_at": "2026-10-29" if platform == "官网" else None,
            "source_url": source_url if source_url and source_url.startswith(("http://", "https://")) else None,
            "source_file": WORKBOOK_NAME,
            "source_sheet": "统一明细表",
            "source_row": excel_row,
            "analysis_eligible": None,
            "metadata_status": metadata_status,
        }
        canonical_records[record_id] = payload
        if original_text:
            normalized_lookup[normalize_text(original_text)].append(record_id)
        if clean_text and clean_text != original_text:
            normalized_lookup[normalize_text(clean_text)].append(record_id)
        if source_url:
            source_url_lookup[source_url].append(record_id)
        record_rows.append(tuple(payload.values()))

    evidence_rows = read_evidence_csv(evidence_path)
    evidence_missing_from_unified: list[str] = []
    alias_mappings: list[tuple[str, str, str]] = []
    alias_conflicts: list[dict[str, Any]] = []
    evidence_supplements: list[tuple[str, str, str, str]] = []

    for row in evidence_rows:
        evidence_id = row.get("证据编号", "")
        if not evidence_id:
            continue
        canonical = canonical_records.get(evidence_id)
        if canonical:
            if not canonical["original_text"] and row.get("反馈原文"):
                canonical["original_text"] = row["反馈原文"]
                canonical["clean_text"] = row["反馈原文"]
                evidence_supplements.append((row["反馈原文"], row["反馈原文"], CASE_DATASET, evidence_id))
            continue
        matches = list(dict.fromkeys(normalized_lookup.get(normalize_text(row.get("反馈原文")), [])))
        if not matches and row.get("原页面链接") and row.get("内容类型") == "用户笔记":
            matches = [
                record_id
                for record_id in source_url_lookup.get(row["原页面链接"], [])
                if canonical_records[record_id]["content_type"] == "用户笔记"
            ]
        if len(matches) == 1:
            alias_mappings.append((evidence_id, matches[0], "原文标准化后唯一匹配"))
        elif len(matches) > 1:
            alias_conflicts.append({"alias": evidence_id, "candidates": matches})
        else:
            evidence_missing_from_unified.append(evidence_id)

    record_columns = [
        "dataset_id", "record_id", "source_record_id", "platform", "source_type", "content_type",
        "product_name", "author_type", "original_text", "clean_text", "substantive", "theme", "sentiment",
        "published_at_raw", "published_at", "collected_at", "source_url", "source_file", "source_sheet",
        "source_row", "analysis_eligible", "metadata_status",
    ]
    placeholders = ",".join("?" for _ in record_columns)

    with db_session(db_path) as db:
        db.execute("DELETE FROM recommendation_evidence")
        db.execute("DELETE FROM recommendations")
        db.execute("DELETE FROM comparison_evidence")
        db.execute("DELETE FROM comparisons")
        db.execute("DELETE FROM claims")
        db.execute("DELETE FROM evidence_aliases WHERE dataset_id = ?", (CASE_DATASET,))
        db.execute("DELETE FROM records WHERE dataset_id = ?", (CASE_DATASET,))
        db.execute(
            "UPDATE datasets SET name=?, version=?, updated_at=CURRENT_TIMESTAMP WHERE dataset_id=?",
            ("小露珠课程案例", "2026-11-15", CASE_DATASET),
        )
        db.executemany(
            f"INSERT INTO records({','.join(record_columns)}) VALUES({placeholders})",
            record_rows,
        )
        for text, clean, dataset_id, record_id in evidence_supplements:
            db.execute(
                "UPDATE records SET original_text=?, clean_text=? WHERE dataset_id=? AND record_id=?",
                (text, clean, dataset_id, record_id),
            )
        db.executemany(
            "INSERT INTO evidence_aliases(dataset_id, alias_id, canonical_record_id, verification, source_file) VALUES(?, ?, ?, ?, ?)",
            [(CASE_DATASET, alias, canonical, verification, EVIDENCE_CSV_NAME) for alias, canonical, verification in alias_mappings],
        )
        for claim in CLAIMS:
            db.execute(
                "INSERT INTO claims(claim_id, topic, title, quote, record_id, source_name, collected_at, summary) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
                tuple(claim[key] for key in ("claim_id", "topic", "title", "quote", "record_id", "source_name", "collected_at", "summary")),
            )
        for comparison in COMPARISONS:
            db.execute(
                "INSERT INTO comparisons(topic, title, claim_id, judgment, conditions, status, action_id) VALUES(?, ?, ?, ?, ?, ?, ?)",
                tuple(comparison[key] for key in ("topic", "title", "claim_id", "judgment", "conditions", "status", "action_id")),
            )
            db.executemany(
                "INSERT INTO comparison_evidence(topic, record_id, role, sort_order) VALUES(?, ?, ?, ?)",
                [(comparison["topic"], record_id, role, order) for order, (record_id, role) in enumerate(comparison["evidence"])],
            )
        for recommendation in RECOMMENDATIONS:
            db.execute(
                "INSERT INTO recommendations(action_id, title, action_text, owner, metric, topic, priority) VALUES(?, ?, ?, ?, ?, ?, ?)",
                tuple(recommendation[key] for key in ("action_id", "title", "action_text", "owner", "metric", "topic", "priority")),
            )
            db.executemany(
                "INSERT INTO recommendation_evidence(action_id, record_id) VALUES(?, ?)",
                [(recommendation["action_id"], record_id) for record_id in recommendation["evidence"]],
            )

    official_sheet = workbook["官网产品信息"]
    official_headers = [display_value(cell.value) or "" for cell in official_sheet[1]]
    official_codes = {
        display_value(row[official_headers.index("商品代码")])
        for row in official_sheet.iter_rows(min_row=2, values_only=True)
        if "商品代码" in official_headers
    }
    evidence_ids = {row.get("证据编号", "") for row in evidence_rows if row.get("证据编号")}
    key_evidence = [
        "HRNF00000134", "20261029_T00054", "20261029_T00238", "Q00019", "Q00195",
        "DY_C000001", "XHS_N001", "XHS_N002", "XHS_N003",
    ]
    resolved_ids = set(canonical_records) | {alias for alias, _, _ in alias_mappings}

    audit = {
        "status": "ready",
        "dataset_id": CASE_DATASET,
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "inputs": {
            WORKBOOK_NAME: {"sha256": sha256_file(workbook_path), "size": workbook_path.stat().st_size},
            EVIDENCE_CSV_NAME: {"sha256": sha256_file(evidence_path), "size": evidence_path.stat().st_size, "encoding": evidence_rows[0].get("_encoding") if evidence_rows else None},
        },
        "required_sheets": {name: {"present": name in workbook.sheetnames, "rows": workbook[name].max_row if name in workbook.sheetnames else 0} for name in REQUIRED_SHEETS},
        "unified_records": len(record_rows),
        "platform_content_counts": [
            {"platform": platform, "content_type": content_type, "count": count}
            for (platform, content_type), count in sorted(platform_types.items())
        ],
        "key_foreign_keys": {
            "official_product_present": "HRNF00000134" in official_codes,
            "evidence_csv_ids": len(evidence_ids),
            "missing_from_unified_or_alias": sorted(evidence_ids - resolved_ids),
            "key_evidence": [{"record_id": record_id, "resolved": record_id in resolved_ids or record_id in official_codes} for record_id in key_evidence],
        },
        "note_aliases": {
            "verified": [{"alias": alias, "canonical_record_id": canonical, "verification": verification} for alias, canonical, verification in alias_mappings],
            "conflicts": alias_conflicts,
            "unresolved": evidence_missing_from_unified,
        },
        "missing_metadata": {
            "dates_by_platform": dict(missing_dates),
            "tags_by_platform": dict(missing_tags),
            "sentiment_by_platform": dict(missing_sentiment),
            "author_type_field_present": "作者类别" in header_index,
        },
        "analysis_sample_membership": {
            "per_record_field_present": "纳入可分析评论" in header_index or "analysis_eligible" in header_index,
            "douyin_expected": 791,
            "xiaohongshu_expected": 707,
            "dynamic_drilldown_available": False,
            "note": "总表提供固定汇总，但统一明细表未提供 791/707 的逐条样本名单或可复算字段。",
        },
        "analytics_mode": FIXED_ANALYTICS["mode"],
    }
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    (DEMO_DIR / "import-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    (DEMO_DIR / "analytics.json").write_text(json.dumps(FIXED_ANALYTICS, ensure_ascii=False, indent=2), encoding="utf-8")
    (DEMO_DIR / "seed-manifest.json").write_text(
        json.dumps(
            {
                "dataset_id": CASE_DATASET,
                "record_count": len(record_rows),
                "source_hashes": {WORKBOOK_NAME: sha256_file(workbook_path), EVIDENCE_CSV_NAME: sha256_file(evidence_path)},
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return audit


if __name__ == "__main__":
    result = seed_database()
    print(json.dumps(result, ensure_ascii=False, indent=2))

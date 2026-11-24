from __future__ import annotations

import json
import csv
import io
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import (
    CASE_DATASET,
    DB_PATH,
    DEFAULT_PAGE_SIZE,
    DEMO_DIR,
    FRONTEND_DIST,
    MAX_PAGE_SIZE,
    SANDBOX_DATASET,
)
from .content import CONSUMER_TABS, FIXED_ANALYTICS, OVERVIEW
from .database import db_session, init_db, prepare_runtime_database
from .importer import (
    batch_from_db,
    commit_batch,
    parse_file,
    preview_payload,
    save_upload,
    validate_batch,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    prepare_runtime_database()
    init_db()
    yield


app = FastAPI(title="小露珠品牌洞察 API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ValidateRequest(BaseModel):
    mapping: dict[str, str] = Field(default_factory=dict)
    sheet: Optional[str] = None


def dataset_id(value: str) -> str:
    mapping = {
        "case": CASE_DATASET,
        "sandbox": SANDBOX_DATASET,
        CASE_DATASET: CASE_DATASET,
        SANDBOX_DATASET: SANDBOX_DATASET,
    }
    if value not in mapping:
        raise HTTPException(status_code=404, detail={"code": "dataset_not_found", "message": "数据集不存在"})
    return mapping[value]


def public_record(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    record = dict(row)
    record["dataset"] = "case" if record.get("dataset_id") == CASE_DATASET else "sandbox"
    record["date_status"] = "available" if record.get("published_at_raw") or record.get("collected_at") else "missing"
    record["theme_status"] = "available" if record.get("theme") else "unlabeled"
    record["author_type"] = record.get("author_type") or "未知"
    return record


def resolve_record(db: sqlite3.Connection, data_id: str, record_id: str) -> tuple[sqlite3.Row | None, str | None]:
    row = db.execute(
        "SELECT * FROM records WHERE dataset_id=? AND record_id=?",
        (data_id, record_id),
    ).fetchone()
    if row:
        return row, None
    alias = db.execute(
        "SELECT canonical_record_id FROM evidence_aliases WHERE dataset_id=? AND alias_id=?",
        (data_id, record_id),
    ).fetchone()
    if not alias:
        return None, None
    row = db.execute(
        "SELECT * FROM records WHERE dataset_id=? AND record_id=?",
        (data_id, alias["canonical_record_id"]),
    ).fetchone()
    return row, record_id


def evidence_records(db: sqlite3.Connection, ids: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for record_id in ids:
        row, alias = resolve_record(db, CASE_DATASET, record_id)
        if row:
            item = public_record(row)
            item["requested_record_id"] = alias or record_id
            results.append(item)
        else:
            results.append({"record_id": record_id, "requested_record_id": record_id, "missing": True})
    return results


@app.get("/api/health")
def health() -> dict[str, Any]:
    try:
        with db_session() as db:
            case_count = db.execute("SELECT COUNT(*) FROM records WHERE dataset_id=?", (CASE_DATASET,)).fetchone()[0]
            sandbox_count = db.execute("SELECT COUNT(*) FROM records WHERE dataset_id=?", (SANDBOX_DATASET,)).fetchone()[0]
        return {"status": "ok", "database": "readable", "case_records": case_count, "sandbox_records": sandbox_count, "database_path": DB_PATH.name}
    except Exception as exc:
        raise HTTPException(status_code=503, detail={"code": "database_unavailable", "message": str(exc)}) from exc


@app.get("/api/case/overview")
def case_overview() -> dict[str, Any]:
    audit_path = DEMO_DIR / "import-audit.json"
    audit_status = "missing"
    if audit_path.exists():
        audit_status = json.loads(audit_path.read_text(encoding="utf-8")).get("status", "unknown")
    with db_session() as db:
        result = dict(OVERVIEW)
        result["case_seed_count"] = db.execute("SELECT COUNT(*) FROM records WHERE dataset_id=?", (CASE_DATASET,)).fetchone()[0]
        result["audit_status"] = audit_status
        result["findings"] = [
            {**finding, "records": evidence_records(db, finding["evidence"])}
            for finding in OVERVIEW["findings"]
        ]
    return result


@app.get("/api/case/consumer/{tab}")
def case_consumer(tab: str) -> dict[str, Any]:
    if tab not in CONSUMER_TABS:
        raise HTTPException(status_code=404, detail={"code": "consumer_tab_not_found", "message": "体验页签不存在"})
    payload = CONSUMER_TABS[tab]
    with db_session() as db:
        return {
            **payload,
            "key": tab,
            "items": [
                {**item, "records": evidence_records(db, item["evidence"])}
                for item in payload["items"]
            ],
        }


@app.get("/api/case/claims")
def case_claims() -> dict[str, Any]:
    with db_session() as db:
        rows = db.execute("SELECT * FROM claims ORDER BY rowid").fetchall()
        claims = []
        for row in rows:
            item = dict(row)
            record, alias = resolve_record(db, CASE_DATASET, row["record_id"])
            item["record"] = public_record(record) if record else {"record_id": row["record_id"], "missing": True}
            claims.append(item)
    return {"items": claims, "source": "官网产品信息", "collected_at": "2026-10-29"}


@app.get("/api/case/comparisons")
def comparison_index() -> dict[str, Any]:
    with db_session() as db:
        rows = db.execute(
            """SELECT c.*, cl.quote AS claim_quote
               FROM comparisons c LEFT JOIN claims cl ON cl.claim_id=c.claim_id
               ORDER BY CASE c.topic WHEN 'moisture' THEN 1 WHEN 'steps' THEN 2 ELSE 3 END"""
        ).fetchall()
    return {"items": [dict(row) for row in rows]}


@app.get("/api/case/comparisons/{topic}")
def comparison_detail(topic: str) -> dict[str, Any]:
    with db_session() as db:
        row = db.execute(
            """SELECT c.*, cl.title AS claim_title, cl.quote AS claim_quote, cl.record_id AS claim_record_id,
                      cl.source_name, cl.collected_at, cl.summary AS claim_summary
               FROM comparisons c LEFT JOIN claims cl ON cl.claim_id=c.claim_id WHERE c.topic=?""",
            (topic,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail={"code": "comparison_not_found", "message": "对照主题不存在"})
        evidence_rows = db.execute(
            "SELECT record_id, role FROM comparison_evidence WHERE topic=? ORDER BY sort_order",
            (topic,),
        ).fetchall()
        evidence = []
        for evidence_row in evidence_rows:
            record, alias = resolve_record(db, CASE_DATASET, evidence_row["record_id"])
            evidence.append({"role": evidence_row["role"], "record": public_record(record) if record else {"record_id": evidence_row["record_id"], "missing": True}})
        action = db.execute("SELECT * FROM recommendations WHERE action_id=?", (row["action_id"],)).fetchone()
    return {**dict(row), "evidence": evidence, "action": dict(action) if action else None}


@app.get("/api/case/recommendations")
def recommendations() -> dict[str, Any]:
    with db_session() as db:
        rows = db.execute("SELECT * FROM recommendations ORDER BY priority").fetchall()
        items = []
        for row in rows:
            evidence_ids = [item["record_id"] for item in db.execute("SELECT record_id FROM recommendation_evidence WHERE action_id=?", (row["action_id"],)).fetchall()]
            items.append({**dict(row), "evidence": evidence_records(db, evidence_ids)})
    return {"items": items}


@app.get("/api/records")
def list_records(
    dataset: str = Query("case"),
    q: str = Query(""),
    platform: str = Query(""),
    content_type: str = Query(""),
    theme: str = Query(""),
    sentiment: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> dict[str, Any]:
    data_id = dataset_id(dataset)
    where = ["dataset_id = ?"]
    params: list[Any] = [data_id]
    normalized_query = "".join(q.split()).lower()
    if normalized_query:
        where.append("(instr(lower(replace(coalesce(record_id,''), ' ', '')), ?) > 0 OR instr(lower(replace(coalesce(original_text,''), ' ', '')), ?) > 0 OR instr(lower(replace(coalesce(clean_text,''), ' ', '')), ?) > 0)")
        params.extend([normalized_query, normalized_query, normalized_query])
    if platform:
        where.append("platform = ?")
        params.append(platform)
    if content_type:
        where.append("content_type = ?")
        params.append(content_type)
    if theme:
        where.append("instr(coalesce(theme, ''), ?) > 0")
        params.append(theme)
    if sentiment:
        where.append("coalesce(sentiment, '') = ?")
        params.append(sentiment)
    where_sql = " AND ".join(where)
    offset = (page - 1) * page_size
    with db_session() as db:
        total = db.execute(f"SELECT COUNT(*) FROM records WHERE {where_sql}", params).fetchone()[0]
        rows = db.execute(
            f"""SELECT dataset_id, record_id, platform, source_type, content_type, original_text,
                        theme, sentiment, published_at_raw, collected_at, source_url, metadata_status
                 FROM records WHERE {where_sql}
                 ORDER BY CASE WHEN record_id = ? THEN 0 ELSE 1 END, record_id
                 LIMIT ? OFFSET ?""",
            [*params, q.strip(), page_size, offset],
        ).fetchall()
        raw_themes = [row[0] for row in db.execute("SELECT DISTINCT theme FROM records WHERE dataset_id=? AND theme IS NOT NULL AND theme<>''", (data_id,)).fetchall()]
        theme_terms = sorted({term.strip() for value in raw_themes for term in str(value).replace(";", "；").split("；") if term.strip()})
        facets = {
            "platforms": [row[0] for row in db.execute("SELECT DISTINCT platform FROM records WHERE dataset_id=? ORDER BY platform", (data_id,)).fetchall()],
            "content_types": [row[0] for row in db.execute("SELECT DISTINCT content_type FROM records WHERE dataset_id=? ORDER BY content_type", (data_id,)).fetchall()],
            "themes": theme_terms,
            "sentiments": [row[0] for row in db.execute("SELECT DISTINCT sentiment FROM records WHERE dataset_id=? AND sentiment IS NOT NULL AND sentiment<>'' ORDER BY sentiment", (data_id,)).fetchall()],
        }
    return {
        "items": [public_record(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, (total + page_size - 1) // page_size),
        "filters": {"dataset": dataset, "q": q, "platform": platform, "content_type": content_type, "theme": theme, "sentiment": sentiment},
        "facets": facets,
    }


@app.get("/api/records-export")
def export_records(
    dataset: str = Query("case"),
    q: str = Query(""),
    platform: str = Query(""),
    content_type: str = Query(""),
    theme: str = Query(""),
    sentiment: str = Query(""),
) -> StreamingResponse:
    data_id = dataset_id(dataset)
    where = ["dataset_id = ?"]
    params: list[Any] = [data_id]
    normalized_query = "".join(q.split()).lower()
    if normalized_query:
        where.append("(instr(lower(replace(coalesce(record_id,''), ' ', '')), ?) > 0 OR instr(lower(replace(coalesce(original_text,''), ' ', '')), ?) > 0 OR instr(lower(replace(coalesce(clean_text,''), ' ', '')), ?) > 0)")
        params.extend([normalized_query, normalized_query, normalized_query])
    for column, value in (("platform", platform), ("content_type", content_type), ("sentiment", sentiment)):
        if value:
            where.append(f"coalesce({column}, '') = ?")
            params.append(value)
    if theme:
        where.append("instr(coalesce(theme, ''), ?) > 0")
        params.append(theme)
    with db_session() as db:
        rows = db.execute(
            f"""SELECT record_id, platform, content_type, author_type, published_at_raw,
                       theme, sentiment, original_text, source_url
                  FROM records WHERE {' AND '.join(where)} ORDER BY record_id""",
            params,
        ).fetchall()

    def safe(value: Any) -> str:
        text = "" if value is None else str(value)
        return f"'{text}" if text.startswith(("=", "+", "-", "@")) else text

    buffer = io.StringIO()
    buffer.write("\ufeff")
    writer = csv.writer(buffer)
    writer.writerow(["record_id", "platform", "content_type", "author_type", "published_at", "theme", "sentiment", "text", "source_url"])
    for row in rows:
        writer.writerow([safe(value) for value in row])
    filename = "brandinsight-evidence.csv"
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.get("/api/records/{dataset}/{record_id}")
def record_detail(dataset: str, record_id: str) -> dict[str, Any]:
    data_id = dataset_id(dataset)
    with db_session() as db:
        row, alias = resolve_record(db, data_id, record_id)
        if not row:
            raise HTTPException(status_code=404, detail={"code": "record_not_found", "message": "记录不存在"})
        record = public_record(row)
        record["requested_record_id"] = record_id
        record["resolved_alias"] = alias
        roles = [dict(item) for item in db.execute("SELECT topic, role FROM comparison_evidence WHERE record_id=?", (record_id,)).fetchall()]
        actions = [dict(item) for item in db.execute("""SELECT r.action_id, r.title FROM recommendations r JOIN recommendation_evidence e ON e.action_id=r.action_id WHERE e.record_id=?""", (record_id,)).fetchall()]
    return {**record, "comparison_roles": roles, "actions": actions}


@app.get("/api/analytics/topics")
def analytics_topics() -> dict[str, Any]:
    path = DEMO_DIR / "analytics.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return FIXED_ANALYTICS


@app.post("/api/imports/preview")
async def import_preview(file: UploadFile = File(...)) -> dict[str, Any]:
    upload = await save_upload(file)
    try:
        parsed = parse_file(upload["stored_path"], upload["kind"])
    except ValueError as exc:
        with db_session() as db:
            db.execute(
                """INSERT INTO import_batches(token, dataset_id, original_name, stored_path, file_hash, file_type,
                   file_size, status, error_json) VALUES(?, ?, ?, ?, ?, ?, ?, 'failed', ?)""",
                (upload["token"], SANDBOX_DATASET, upload["original_name"], str(upload["stored_path"]), upload["file_hash"], upload["kind"], upload["file_size"], json.dumps({"message": str(exc)}, ensure_ascii=False)),
            )
        raise HTTPException(status_code=422, detail={"code": "unreadable_file", "message": str(exc)}) from exc
    with db_session() as db:
        db.execute(
            """INSERT INTO import_batches(token, dataset_id, original_name, stored_path, file_hash, file_type,
               file_size, selected_sheet, status, total_rows) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 'previewed', ?)""",
            (upload["token"], SANDBOX_DATASET, upload["original_name"], str(upload["stored_path"]), upload["file_hash"], upload["kind"], upload["file_size"], parsed.selected_sheet, len(parsed.rows)),
        )
    return preview_payload(batch_from_db(upload["token"]), parsed)


@app.post("/api/imports/{token}/validate")
def import_validate(token: str, request: ValidateRequest) -> dict[str, Any]:
    try:
        return validate_batch(token, request.mapping, request.sheet)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"code": "validation_parse_failed", "message": str(exc)}) from exc


@app.post("/api/imports/{token}/commit")
def import_commit(token: str) -> dict[str, Any]:
    return commit_batch(token)


@app.get("/api/imports")
def list_imports() -> dict[str, Any]:
    with db_session() as db:
        rows = db.execute(
            """SELECT token, original_name, file_type, file_size, selected_sheet, status, total_rows,
                      inserted_rows, skipped_rows, conflict_rows, created_at, committed_at
               FROM import_batches ORDER BY created_at DESC LIMIT 50"""
        ).fetchall()
    return {"items": [dict(row) for row in rows], "dataset": "sandbox"}


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: dict[str, Any]):
        try:
            response = await super().get_response(path, scope)
        except (StarletteHTTPException, HTTPException) as exc:
            if getattr(exc, "status_code", None) == 404 and FRONTEND_DIST.joinpath("index.html").exists():
                response = FileResponse(FRONTEND_DIST / "index.html")
            else:
                raise

        content_type = response.headers.get("content-type", "")
        if content_type.startswith("text/html"):
            response.headers["Cache-Control"] = "no-store, max-age=0"
        elif path.startswith("assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"

        return response


if FRONTEND_DIST.exists():
    app.mount("/", SPAStaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


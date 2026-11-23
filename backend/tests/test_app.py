from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEST_DB = PROJECT_ROOT / "data" / "state" / "test-xiaoluzhu.sqlite3"
os.environ["XLZ_DB_PATH"] = str(TEST_DB)

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import FRONTEND_DIST
from backend.app.seed import seed_database


def setup_module() -> None:
    for suffix in ("", "-wal", "-shm"):
        path = Path(str(TEST_DB) + suffix)
        if path.exists():
            path.unlink()
    audit = seed_database(TEST_DB)
    assert audit["unified_records"] == 6610


def teardown_module() -> None:
    for suffix in ("", "-wal", "-shm"):
        path = Path(str(TEST_DB) + suffix)
        if path.exists():
            path.unlink()


def test_health_and_main_case_search() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["case_records"] == 6610

        search = client.get("/api/records", params={"q": "干皮单用", "dataset": "case"})
        assert search.status_code == 200
        payload = search.json()
        assert payload["total"] >= 1
        assert any(item["record_id"] == "20261029_T00238" for item in payload["items"])

        exact = client.get("/api/records", params={"q": "20261029_T00238", "dataset": "case"})
        assert exact.json()["items"][0]["record_id"] == "20261029_T00238"


def test_alias_and_comparison_chain() -> None:
    with TestClient(app) as client:
        detail = client.get("/api/records/case/XHS_N002")
        assert detail.status_code == 200
        payload = detail.json()
        assert payload["resolved_alias"] == "XHS_N002"
        assert payload["record_id"] == "XHS_N_6a55092a000000000f017042"

        comparison = client.get("/api/case/comparisons/moisture")
        assert comparison.status_code == 200
        evidence = comparison.json()["evidence"]
        assert [item["record"]["record_id"] for item in evidence] == ["20261029_T00054", "20261029_T00238"]


def test_import_is_validated_atomic_and_idempotent() -> None:
    csv_bytes = (
        "平台,内容类型,原文,原始编号,来源\n"
        "天猫,购买后评价,挺好的干皮单用略干叠精华刚好,DEMO_IMPORT_001,https://detail.tmall.com/item.htm?id=557357372636\n"
    ).encode("utf-8-sig")
    with TestClient(app) as client:
        preview = client.post("/api/imports/preview", files={"file": ("答辩演示.csv", csv_bytes, "text/csv")})
        assert preview.status_code == 200
        payload = preview.json()
        token = payload["token"]
        mapping = payload["mapping"]
        validation = client.post(f"/api/imports/{token}/validate", json={"mapping": mapping, "sheet": None})
        assert validation.status_code == 200
        assert validation.json()["has_blocking"] is False

        committed = client.post(f"/api/imports/{token}/commit")
        assert committed.status_code == 200
        assert committed.json()["inserted"] == 1

        replay = client.post(f"/api/imports/{token}/commit")
        assert replay.status_code == 200
        assert replay.json()["idempotent_replay"] is True

        search = client.get("/api/records", params={"dataset": "sandbox", "q": "DEMO_IMPORT_001"})
        assert search.status_code == 200
        assert search.json()["total"] == 1


def test_invalid_url_blocks_commit() -> None:
    csv_bytes = "平台,内容类型,原文,原始编号,来源\n小红书,社媒评论,测试原文,BAD_URL_001,file:///etc/passwd\n".encode("utf-8")
    with TestClient(app) as client:
        preview = client.post("/api/imports/preview", files={"file": ("非法链接.csv", csv_bytes, "text/csv")})
        assert preview.status_code == 200
        payload = preview.json()
        validation = client.post(f"/api/imports/{payload['token']}/validate", json={"mapping": payload["mapping"], "sheet": None})
        assert validation.status_code == 200
        assert validation.json()["has_blocking"] is True

        commit = client.post(f"/api/imports/{payload['token']}/commit")
        assert commit.status_code == 422
        search = client.get("/api/records", params={"dataset": "sandbox", "q": "BAD_URL_001"})
        assert search.json()["total"] == 0


def test_frontend_cache_headers() -> None:
    if not FRONTEND_DIST.joinpath("index.html").exists():
        return

    with TestClient(app) as client:
        home = client.get("/")
        assert home.status_code == 200
        assert home.headers["cache-control"] == "no-store, max-age=0"

        nested_route = client.get("/workspace")
        assert nested_route.status_code == 200
        assert nested_route.headers["cache-control"] == "no-store, max-age=0"


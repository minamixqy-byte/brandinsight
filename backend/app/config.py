from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
IS_VERCEL = bool(os.environ.get("VERCEL"))
RUNTIME_DATA_DIR = Path("/tmp/brandinsight") if IS_VERCEL else DATA_DIR
SOURCE_DIR = DATA_DIR / "source"
DEMO_DIR = DATA_DIR / "demo"
UPLOAD_DIR = RUNTIME_DATA_DIR / "uploads"
STATE_DIR = RUNTIME_DATA_DIR / "state"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
PACKAGED_DB_PATH = DATA_DIR / "state" / "xiaoluzhu.sqlite3"

DB_PATH = Path(os.environ.get("XLZ_DB_PATH", STATE_DIR / "xiaoluzhu.sqlite3"))
CASE_DATASET = "xlz-case-v1"
SANDBOX_DATASET = "xlz-sandbox-v1"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


def ensure_directories() -> None:
    for path in (UPLOAD_DIR, STATE_DIR):
        path.mkdir(parents=True, exist_ok=True)


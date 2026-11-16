from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
SOURCE_DIR = DATA_DIR / "source"
DEMO_DIR = DATA_DIR / "demo"
UPLOAD_DIR = DATA_DIR / "uploads"
STATE_DIR = DATA_DIR / "state"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

DB_PATH = Path(os.environ.get("XLZ_DB_PATH", STATE_DIR / "xiaoluzhu.sqlite3"))
CASE_DATASET = "xlz-case-v1"
SANDBOX_DATASET = "xlz-sandbox-v1"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


def ensure_directories() -> None:
    for path in (SOURCE_DIR, DEMO_DIR, UPLOAD_DIR, STATE_DIR):
        path.mkdir(parents=True, exist_ok=True)


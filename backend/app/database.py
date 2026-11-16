from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import CASE_DATASET, DB_PATH, SANDBOX_DATASET, ensure_directories


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS datasets (
  dataset_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('case', 'sandbox')),
  read_only INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS records (
  dataset_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  source_record_id TEXT,
  platform TEXT NOT NULL,
  source_type TEXT,
  content_type TEXT NOT NULL,
  product_name TEXT,
  author_type TEXT,
  original_text TEXT NOT NULL DEFAULT '',
  clean_text TEXT NOT NULL DEFAULT '',
  substantive INTEGER,
  theme TEXT,
  sentiment TEXT,
  published_at_raw TEXT,
  published_at TEXT,
  collected_at TEXT,
  source_url TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row INTEGER,
  analysis_eligible INTEGER,
  metadata_status TEXT NOT NULL DEFAULT 'complete',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dataset_id, record_id),
  FOREIGN KEY (dataset_id) REFERENCES datasets(dataset_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_search ON records(dataset_id, platform, content_type, record_id);
CREATE INDEX IF NOT EXISTS idx_records_theme ON records(dataset_id, theme);
CREATE INDEX IF NOT EXISTS idx_records_order ON records(dataset_id, source_file, source_sheet, source_row);

CREATE TABLE IF NOT EXISTS evidence_aliases (
  dataset_id TEXT NOT NULL,
  alias_id TEXT NOT NULL,
  canonical_record_id TEXT NOT NULL,
  verification TEXT NOT NULL,
  source_file TEXT NOT NULL,
  PRIMARY KEY (dataset_id, alias_id),
  FOREIGN KEY (dataset_id, canonical_record_id) REFERENCES records(dataset_id, record_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  quote TEXT NOT NULL,
  record_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  collected_at TEXT,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comparisons (
  topic TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  claim_id TEXT,
  judgment TEXT NOT NULL,
  conditions TEXT NOT NULL,
  status TEXT NOT NULL,
  action_id TEXT,
  FOREIGN KEY (claim_id) REFERENCES claims(claim_id)
);

CREATE TABLE IF NOT EXISTS comparison_evidence (
  topic TEXT NOT NULL,
  record_id TEXT NOT NULL,
  role TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (topic, record_id, role),
  FOREIGN KEY (topic) REFERENCES comparisons(topic) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendations (
  action_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  action_text TEXT NOT NULL,
  owner TEXT NOT NULL,
  metric TEXT NOT NULL,
  topic TEXT NOT NULL,
  priority INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_evidence (
  action_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  PRIMARY KEY (action_id, record_id),
  FOREIGN KEY (action_id) REFERENCES recommendations(action_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_batches (
  token TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  selected_sheet TEXT,
  mapping_json TEXT,
  status TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  conflict_rows INTEGER NOT NULL DEFAULT 0,
  error_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_at TEXT,
  FOREIGN KEY (dataset_id) REFERENCES datasets(dataset_id)
);
"""


def connect(path: Path | None = None) -> sqlite3.Connection:
    ensure_directories()
    connection = sqlite3.connect(path or DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection


@contextmanager
def db_session(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    connection = connect(path)
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db(path: Path | None = None) -> None:
    with db_session(path) as db:
        db.executescript(SCHEMA)
        db.execute(
            """INSERT INTO datasets(dataset_id, name, kind, read_only, version)
               VALUES(?, ?, 'case', 1, '2026-11-15')
               ON CONFLICT(dataset_id) DO NOTHING""",
            (CASE_DATASET, "小露珠课程案例",),
        )
        db.execute(
            """INSERT INTO datasets(dataset_id, name, kind, read_only, version)
               VALUES(?, ?, 'sandbox', 0, 'local')
               ON CONFLICT(dataset_id) DO NOTHING""",
            (SANDBOX_DATASET, "试验数据集",),
        )

#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

backup_path="${1:-}"
if [[ -z "$backup_path" || ! -f "$backup_path" ]]; then
  echo "用法：scripts/restore.sh data/backups/文件.sqlite3" >&2
  exit 1
fi
.venv/bin/python -c 'import sqlite3,sys; src=sqlite3.connect(sys.argv[1]); src.execute("PRAGMA schema_version").fetchone(); src.close()' "$backup_path"
scripts/backup.sh >/dev/null
cp "$backup_path" data/state/xiaoluzhu.sqlite3
echo "已恢复数据库，恢复前状态已自动备份到 data/backups/。"


#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

source_db="data/state/xiaoluzhu.sqlite3"
if [[ ! -f "$source_db" ]]; then
  echo "数据库不存在，请先运行 scripts/seed.sh" >&2
  exit 1
fi
mkdir -p data/backups
stamp="$(date +%Y%m%d-%H%M%S)"
target="data/backups/xiaoluzhu-${stamp}.sqlite3"
.venv/bin/python -c 'import sqlite3,sys; src=sqlite3.connect(sys.argv[1]); dst=sqlite3.connect(sys.argv[2]); src.backup(dst); dst.close(); src.close()' "$source_db" "$target"
echo "$target"


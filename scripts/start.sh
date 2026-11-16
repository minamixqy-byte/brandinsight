#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

if [[ ! -x .venv/bin/python ]]; then
  echo "缺少 .venv，请先运行 scripts/bootstrap.sh" >&2
  exit 1
fi
if [[ ! -f data/state/xiaoluzhu.sqlite3 ]]; then
  .venv/bin/python -m backend.app.seed
fi
if [[ ! -f frontend/dist/index.html ]]; then
  scripts/build.sh
fi

exec .venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port "${PORT:-8000}"


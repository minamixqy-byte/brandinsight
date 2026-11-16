#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements-dev.txt

pnpm_bin="${PNPM_BIN:-pnpm}"
if ! command -v "$pnpm_bin" >/dev/null 2>&1; then
  echo "缺少 pnpm。请先安装 Node.js 18+ 与 pnpm 9+，或通过 PNPM_BIN 指定可执行文件。" >&2
  exit 1
fi
export CI=true
if [[ -f frontend/pnpm-lock.yaml ]]; then
  "$pnpm_bin" --dir frontend install --frozen-lockfile
else
  "$pnpm_bin" --dir frontend install
fi

.venv/bin/python -m backend.app.seed
"$pnpm_bin" --dir frontend build

echo "初始化完成。运行 scripts/start.sh 后访问 http://127.0.0.1:8000"


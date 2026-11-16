#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
pnpm_bin="${PNPM_BIN:-pnpm}"
if ! command -v "$pnpm_bin" >/dev/null 2>&1; then
  echo "缺少 pnpm。请先安装 Node.js 18+ 与 pnpm 9+，或通过 PNPM_BIN 指定可执行文件。" >&2
  exit 1
fi
export CI=true
"$pnpm_bin" --dir frontend build


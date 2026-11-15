#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
backend_pid=''
frontend_pid=''
cleanup() {
  trap - EXIT INT TERM
  [ -z "$backend_pid" ] || kill "$backend_pid" 2>/dev/null || true
  [ -z "$frontend_pid" ] || kill "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
if [ ! -d frontend/node_modules ]; then (cd frontend && npm ci); fi
mkdir -p bin
(cd backend && go build -o ../bin/tersane-backend .)
./bin/tersane-backend &
backend_pid=$!
(cd frontend && exec npm run dev) &
frontend_pid=$!
printf '\nKubeView: http://127.0.0.1:5173 · backend port %s · READ_ONLY=%s\n' "${PORT:-8000}" "${READ_ONLY:-true}"
wait "$backend_pid" "$frontend_pid"

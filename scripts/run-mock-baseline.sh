#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${MOCK_TEST_BASE_URL:-http://127.0.0.1:3300}"
TOTAL="${MOCK_TEST_TOTAL:-100}"
CONCURRENCY="${MOCK_TEST_CONCURRENCY:-10}"
OUT="${MOCK_TEST_OUTPUT_PATH:-docs/week11/backend/evidence/mock-load-baseline-2026-03-26.json}"
PORT="${PORT:-3300}"

mkdir -p "$(dirname "$OUT")"

PORT="$PORT" node server.js >/tmp/agentbanking-server-"$PORT".log 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 1
MOCK_TEST_BASE_URL="$BASE_URL" MOCK_TEST_TOTAL="$TOTAL" MOCK_TEST_CONCURRENCY="$CONCURRENCY" \
  node scripts/mock-service-runner.js >"$OUT"

echo "PASS: mock baseline captured -> $OUT"

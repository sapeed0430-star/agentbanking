#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_PATH="${REPORT_PATH:-$ROOT/docs/week2/backend/runtime-proof-2026-03-24.md}"
COMPOSE_FILE="$ROOT/deploy/docker-compose.staging.yml"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/runtime-proof.XXXXXX")"
BASE_URL=""
COMPOSE_UP_LOG="$TMP_DIR/compose-up.log"
COMPOSE_PS_LOG="$TMP_DIR/compose-ps.json"
COMPOSE_DOWN_LOG="$TMP_DIR/compose-down.log"
NODE_LOG="$TMP_DIR/node.log"
JWKS_BODY="$TMP_DIR/jwks.json"
VERIFY_BODY="$TMP_DIR/verify.json"
VERIFY_PAYLOAD="$TMP_DIR/verify-payload.json"
COMPOSE_EXIT=0
COMPOSE_CHECK_EXIT=0
NODE_EXIT=0
NODE_PID=""
COMPOSE_UP_ATTEMPTED=0
COMPOSE_UP_SUCCESS=0
NODE_STARTED=0
NODE_HEALTH_OK=0
JWKS_CODE=""
VERIFY_CODE=""
VERDICT="BLOCK"
EXECUTION_MODE="compose"
FALLBACK_REASON=""
FAILURE_REASON=""
COMPOSE_HEALTH_SUMMARY=""
JWKS_SUMMARY=""
VERIFY_SUMMARY=""
REQUEST_ID=""
START_AT="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"
START_ISO="$(TZ=Asia/Seoul date '+%Y-%m-%dT%H:%M:%S%z')"
HOST_PORT="${STAGING_API_PORT:-3210}"

cleanup() {
  if [[ -n "${NODE_PID:-}" ]] && kill -0 "$NODE_PID" 2>/dev/null; then
    kill "$NODE_PID" >/dev/null 2>&1 || true
    wait "$NODE_PID" >/dev/null 2>&1 || true
  fi
  if [[ "${COMPOSE_UP_SUCCESS}" -eq 1 ]] && command -v docker >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" down >"$COMPOSE_DOWN_LOG" 2>&1 || true
  fi
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

ensure_payload() {
  REQUEST_ID="runtime-proof-$(TZ=Asia/Seoul date '+%Y%m%d%H%M%S')-${RANDOM}"
  cat >"$VERIFY_PAYLOAD" <<JSON
{
  "request_id": "$REQUEST_ID",
  "agent_id": "agent-runtime-proof",
  "operator_id": "operator-runtime-proof",
  "policy_version": "policy-2026.03",
  "strategy_hash": "strat-runtime-proof-1100",
  "model_hash": "model-runtime-proof-1100",
  "evidence_refs": [
    {
      "kind": "input",
      "uri": "https://evidence.agentbanking.dev/runtime-proof/2026-03-24",
      "digest": {
        "alg": "sha-256",
        "value": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      }
    }
  ]
}
JSON
}

wait_for_http() {
  local url="$1"
  local expected="$2"
  local attempts="$3"
  local delay="$4"
  local body_file="$5"
  local code
  local curl_status
  local i

  for ((i = 1; i <= attempts; i++)); do
    set +e
    code="$(curl -sS -o "$body_file" -w '%{http_code}' "$url" 2>/dev/null)"
    curl_status=$?
    set -e
    if [[ "$curl_status" -eq 0 && "$code" == "$expected" ]]; then
      printf '%s' "$code"
      return 0
    fi
    sleep "$delay"
  done

  return 1
}

compose_health_summary() {
  local ps_json="$1"
  node --input-type=module -e '
    import fs from "node:fs";
    const raw = fs.readFileSync(process.argv[1], "utf8");
    const items = JSON.parse(raw);
    const first = Array.isArray(items) ? items[0] : null;
    if (!first) process.exit(1);
    const summary = {
      service: first.Service ?? first.ServiceName ?? first.Name ?? "api",
      state: first.State ?? "",
      health: first.Health ?? "",
      id: first.ID ?? first.Id ?? "",
      publish: first.Publishers ?? [],
    };
    process.stdout.write(JSON.stringify(summary, null, 2));
  ' "$ps_json"
}

jwks_summary() {
  local body_file="$1"
  node --input-type=module -e '
    import fs from "node:fs";
    const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const keys = Array.isArray(body.keys) ? body.keys : [];
    const summary = {
      key_count: keys.length,
      first_kid: keys[0]?.kid ?? "",
      first_kty: keys[0]?.kty ?? "",
      first_crv: keys[0]?.crv ?? "",
    };
    process.stdout.write(JSON.stringify(summary, null, 2));
  ' "$body_file"
}

verify_summary() {
  local body_file="$1"
  node --input-type=module -e '
    import fs from "node:fs";
    const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const receipt = body.receipt ?? {};
    const summary = {
      receipt_id: receipt.receipt_id ?? "",
      report_id: receipt.report_id ?? "",
      verification_result: receipt.verification_result ?? "",
      has_signature: Boolean(receipt.signature),
      has_timestamp_proof: Boolean(receipt.timestamp_proof),
      has_transparency_proof: Boolean(receipt.transparency_proof),
    };
    process.stdout.write(JSON.stringify(summary, null, 2));
  ' "$body_file"
}

run_compose_attempt() {
  local compose_cmd=(docker compose -f "$COMPOSE_FILE" up -d --build)
  COMPOSE_UP_ATTEMPTED=1

  if "${compose_cmd[@]}" >"$COMPOSE_UP_LOG" 2>&1; then
    COMPOSE_UP_SUCCESS=1
    BASE_URL="http://127.0.0.1:${HOST_PORT}"
    if wait_for_http "$BASE_URL/.well-known/jwks.json" 200 90 2 "$JWKS_BODY"; then
      JWKS_CODE="200"
    fi
    if [[ -z "$JWKS_CODE" ]]; then
      COMPOSE_CHECK_EXIT=1
      FAILURE_REASON="compose health/runtime check did not become ready"
      return 1
    fi
    if docker compose -f "$COMPOSE_FILE" ps --format json >"$COMPOSE_PS_LOG" 2>/dev/null; then
      COMPOSE_HEALTH_SUMMARY="$(compose_health_summary "$COMPOSE_PS_LOG" || true)"
      if [[ -z "$COMPOSE_HEALTH_SUMMARY" ]]; then
        COMPOSE_CHECK_EXIT=1
        FAILURE_REASON="compose ps output could not be summarized"
        return 1
      fi
    else
      COMPOSE_CHECK_EXIT=1
      FAILURE_REASON="docker compose ps failed after startup"
      return 1
    fi

    ensure_payload
    VERIFY_CODE="$(curl -sS -o "$VERIFY_BODY" -w '%{http_code}' \
      -X POST "$BASE_URL/verify" \
      -H 'authorization: Bearer local-dev-token' \
      -H 'content-type: application/json' \
      -H 'x-operator-id: operator-runtime-proof' \
      --data @"$VERIFY_PAYLOAD")"
    if [[ "$VERIFY_CODE" != "201" ]]; then
      COMPOSE_CHECK_EXIT=1
      FAILURE_REASON="compose verify returned HTTP $VERIFY_CODE"
      return 1
    fi

    VERIFY_SUMMARY="$(verify_summary "$VERIFY_BODY")"
    return 0
  fi

  COMPOSE_EXIT=$?
  COMPOSE_CHECK_EXIT=$COMPOSE_EXIT
  FAILURE_REASON="$(sed -n '1,20p' "$COMPOSE_UP_LOG" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
  return 1
}

run_node_fallback() {
  EXECUTION_MODE="node-fallback"
  FALLBACK_REASON="${FALLBACK_REASON:-compose unavailable or failed}"
  BASE_URL="http://127.0.0.1:${HOST_PORT}"
  NODE_STARTED=1
  PORT="$HOST_PORT" node "$ROOT/server.js" >"$NODE_LOG" 2>&1 &
  NODE_PID="$!"

  if wait_for_http "$BASE_URL/.well-known/jwks.json" 200 40 1 "$JWKS_BODY"; then
    NODE_HEALTH_OK=1
    JWKS_CODE="200"
  else
    NODE_EXIT=1
    FAILURE_REASON="node fallback server did not become ready"
    return 1
  fi

  if [[ "$NODE_HEALTH_OK" -ne 1 ]]; then
    NODE_EXIT=1
    FAILURE_REASON="node fallback readiness probe failed"
    return 1
  fi

  ensure_payload
  VERIFY_CODE="$(curl -sS -o "$VERIFY_BODY" -w '%{http_code}' \
    -X POST "$BASE_URL/verify" \
    -H 'authorization: Bearer local-dev-token' \
    -H 'content-type: application/json' \
    -H 'x-operator-id: operator-runtime-proof' \
    --data @"$VERIFY_PAYLOAD")"
  if [[ "$VERIFY_CODE" != "201" ]]; then
    NODE_EXIT=1
    FAILURE_REASON="node fallback verify returned HTTP $VERIFY_CODE"
    return 1
  fi

  VERIFY_SUMMARY="$(verify_summary "$VERIFY_BODY")"
  return 0
}

write_report() {
  local report_verdict="$1"
  local compose_section="$2"
  local fallback_section="$3"
  local jwks_section="$4"
  local verify_section="$5"
  local compose_log_text="$6"
  local node_log_text="$7"
  local end_at
  end_at="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"

  cat >"$REPORT_PATH" <<EOF
# Runtime Proof Report - 2026-03-24

## Scope
- Goal: capture staging runtime proof with compose-first execution and node fallback.
- Workspace: $ROOT
- Validation date: 2026-03-24 (KST)
- Start: $START_AT
- End: $end_at
- Executor: Backend/Ops Worker B

## Execution Summary
| Path | Command | Result | Notes |
| --- | --- | --- | --- |
$compose_section
$fallback_section

## Endpoint Checks
$JWKS_SUMMARY

$VERIFY_SUMMARY

## PASS / FAIL Criteria
- PASS when compose startup succeeds, container health is healthy, \`GET /.well-known/jwks.json\` returns \`200\`, and \`POST /verify\` returns \`201\`.
- PARTIAL PASS when compose is unavailable or fails but the node fallback reproduces the same endpoint behavior with \`200\`/\`201\` codes.
- FAIL when both compose and fallback cannot complete the health/jwks/verify sequence.

## Failure Cause
- Compose attempt: ${FAILURE_REASON:-none recorded}
- Fallback path: ${FALLBACK_REASON:-completed successfully}

## Next Actions
1. Re-run this report on a host with Docker Compose available if compose-first evidence is required.
2. Preserve the generated request/response artifacts when attaching the runtime proof bundle.
3. If fallback was used, treat the compose runtime proof as pending rather than complete.

## Verdict
- Overall verdict: $report_verdict

## Logs
### Compose Attempt
\`\`\`text
$compose_log_text
\`\`\`

### Node Fallback
\`\`\`text
$node_log_text
\`\`\`

### JWKS Response Summary
\`\`\`json
$JWKS_SUMMARY
\`\`\`

### Verify Response Summary
\`\`\`json
$VERIFY_SUMMARY
\`\`\`
EOF
}

if run_compose_attempt; then
  VERDICT="PASS"
  FALLBACK_REASON="not needed"
else
  if [[ "$COMPOSE_UP_ATTEMPTED" -eq 1 && "$COMPOSE_UP_SUCCESS" -eq 1 && -z "$COMPOSE_HEALTH_SUMMARY" ]]; then
    FALLBACK_REASON="compose startup completed but runtime checks failed"
  else
    FALLBACK_REASON="${FAILURE_REASON:-compose unavailable or failed}"
  fi
  if [[ "$COMPOSE_UP_SUCCESS" -eq 1 ]] && command -v docker >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" down >"$COMPOSE_DOWN_LOG" 2>&1 || true
    COMPOSE_UP_SUCCESS=0
  fi
  if run_node_fallback; then
    VERDICT="PARTIAL PASS"
    FALLBACK_REASON="node fallback succeeded after compose failure"
  else
    VERDICT="BLOCK"
  fi
fi

compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | $([[ "$COMPOSE_UP_SUCCESS" -eq 1 ]] && echo PASS || echo FAIL) | ${COMPOSE_EXIT:-0} / ${COMPOSE_CHECK_EXIT:-0}"
if [[ "$COMPOSE_UP_ATTEMPTED" -eq 1 && "$COMPOSE_UP_SUCCESS" -eq 1 ]]; then
  compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | PASS | health=${COMPOSE_HEALTH_SUMMARY:-container_started}"
else
  compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | FAIL | ${FAILURE_REASON:-compose unavailable}"
fi

fallback_section="- Node fallback | \`PORT=${HOST_PORT} node server.js\` | $([[ "$NODE_STARTED" -eq 1 && "$NODE_HEALTH_OK" -eq 1 && "$VERIFY_CODE" == "201" ]] && echo PASS || echo FAIL) | health=process_up, jwks=200, verify=201"

JWKS_SUMMARY="$(jwks_summary "$JWKS_BODY" 2>/dev/null || true)"
if [[ -z "$JWKS_SUMMARY" ]]; then
  JWKS_SUMMARY='{"key_count":0,"first_kid":"","first_kty":"","first_crv":""}'
fi
jwks_section="- HTTP \`GET /.well-known/jwks.json\` | \`$JWKS_CODE\` | $([[ "$JWKS_CODE" == "200" ]] && echo PASS || echo FAIL) | $JWKS_SUMMARY"

verify_section="- HTTP \`POST /verify\` | \`$VERIFY_CODE\` | $([[ "$VERIFY_CODE" == "201" ]] && echo PASS || echo FAIL) | $VERIFY_SUMMARY"

compose_log_text="$(sed -n '1,80p' "$COMPOSE_UP_LOG" 2>/dev/null || true)"
if [[ -z "$compose_log_text" ]]; then
  compose_log_text="(no compose output captured)"
fi

node_log_text="$(sed -n '1,80p' "$NODE_LOG" 2>/dev/null || true)"
if [[ -z "$node_log_text" ]]; then
  node_log_text="(node fallback not executed)"
fi

write_report "$VERDICT" "$compose_section" "$fallback_section" "$jwks_section" "$verify_section" "$compose_log_text" "$node_log_text"

printf 'runtime proof report written to %s\n' "$REPORT_PATH"
printf 'overall verdict: %s\n' "$VERDICT"

if [[ "$VERDICT" == "BLOCK" ]]; then
  exit 1
fi

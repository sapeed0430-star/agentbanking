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
COMPOSE_ATTEMPT_REASON=""
COMPOSE_HEALTH_SUMMARY=""
JWKS_SUMMARY=""
VERIFY_SUMMARY=""
REQUEST_ID=""
DOCKER_STATUS=""
DAEMON_STATUS=""
COMPOSE_PLUGIN_STATUS=""
FALLBACK_STATUS=""
DOCKER_BIN_PATH=""
DOCKER_VERSION_OUTPUT=""
DOCKER_INFO_OUTPUT=""
DOCKER_COMPOSE_VERSION_OUTPUT=""
BIND_PROBE_OUTPUT=""
START_AT="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"
START_ISO="$(TZ=Asia/Seoul date '+%Y-%m-%dT%H:%M:%S%z')"
REPORT_DATE="$(TZ=Asia/Seoul date '+%Y-%m-%d')"
HOST_PORT="${STAGING_API_PORT:-3210}"
ACTIVE_FALLBACK_PORT="$HOST_PORT"
RUNTIME_AUTH_TOKEN="${RUNTIME_PROOF_AUTH_TOKEN:-local-dev-token}"

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

probe_runtime() {
  if ! command -v docker >/dev/null 2>&1; then
    DOCKER_STATUS="DOCKER_MISSING"
    DAEMON_STATUS="SKIPPED"
    COMPOSE_PLUGIN_STATUS="SKIPPED"
    DOCKER_BIN_PATH="(not found)"
    DOCKER_VERSION_OUTPUT="docker: command not found"
    DOCKER_INFO_OUTPUT="(skipped)"
    DOCKER_COMPOSE_VERSION_OUTPUT="(skipped)"
    return 1
  fi

  DOCKER_BIN_PATH="$(command -v docker)"
  DOCKER_VERSION_OUTPUT="$(docker --version 2>&1 || true)"
  DOCKER_STATUS="RUNTIME_OK"

  if ! docker info >/dev/null 2>&1; then
    DAEMON_STATUS="DAEMON_DOWN"
    COMPOSE_PLUGIN_STATUS="SKIPPED"
    DOCKER_INFO_OUTPUT="$(docker info 2>&1 | sed -n '1,20p' || true)"
    DOCKER_COMPOSE_VERSION_OUTPUT="(skipped)"
    return 1
  fi

  DAEMON_STATUS="RUNTIME_OK"
  DOCKER_INFO_OUTPUT="$(docker info 2>&1 | sed -n '1,20p' || true)"

  if ! docker compose version >/dev/null 2>&1; then
    COMPOSE_PLUGIN_STATUS="COMPOSE_MISSING"
    DOCKER_COMPOSE_VERSION_OUTPUT="$(docker compose version 2>&1 || true)"
    return 1
  fi

  COMPOSE_PLUGIN_STATUS="RUNTIME_OK"
  DOCKER_COMPOSE_VERSION_OUTPUT="$(docker compose version 2>&1 || true)"
  return 0
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
    code="$(curl --connect-timeout 1 --max-time 2 -sS -o "$body_file" -w '%{http_code}' "$url" 2>/dev/null)"
    curl_status=$?
    set -e
    if [[ "$curl_status" -eq 0 && "$code" == "$expected" ]]; then
      return 0
    fi
    sleep "$delay"
  done

  return 1
}

reserve_fallback_port() {
  local preferred_port="$1"
  local reserved_port="$preferred_port"

  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$preferred_port" -sTCP:LISTEN >/dev/null 2>&1; then
    reserved_port="$(node --input-type=module -e '
      import net from "node:net";
      const server = net.createServer();
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        process.stdout.write(String(address.port));
        server.close();
      });
    ')"
    FALLBACK_REASON="${FALLBACK_REASON:-compose unavailable or failed}; port ${preferred_port} already in use, switched to ${reserved_port}"
  fi

  printf '%s' "$reserved_port"
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

capture_bind_probe() {
  local bind_probe_script="$TMP_DIR/bind-probe.mjs"
  local bind_probe_log="$TMP_DIR/bind-probe.log"
  cat >"$bind_probe_script" <<'NODE'
import http from "node:http";
const server = http.createServer((req, res) => res.end("ok"));
server.listen(Number(process.env.PORT || 3210), "127.0.0.1", () => {
  console.log("bind probe ready");
  server.close(() => process.exit(0));
});
server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
NODE
  if node "$bind_probe_script" >"$bind_probe_log" 2>&1; then
    BIND_PROBE_OUTPUT="$(cat "$bind_probe_log")"
    return 0
  fi
  BIND_PROBE_OUTPUT="$(cat "$bind_probe_log")"
  return 1
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
        COMPOSE_HEALTH_SUMMARY='{"service":"api","state":"unknown","health":"unknown","note":"compose_ps_unparsed"}'
      fi
    else
      COMPOSE_HEALTH_SUMMARY='{"service":"api","state":"unknown","health":"unknown","note":"compose_ps_unavailable"}'
    fi

    ensure_payload
    VERIFY_CODE="$(curl -sS -o "$VERIFY_BODY" -w '%{http_code}' \
      -X POST "$BASE_URL/verify" \
      -H "authorization: Bearer ${RUNTIME_AUTH_TOKEN}" \
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
  ACTIVE_FALLBACK_PORT="$(reserve_fallback_port "$HOST_PORT")"
  BASE_URL="http://127.0.0.1:${ACTIVE_FALLBACK_PORT}"
  NODE_STARTED=1
  local node_fallback_script="$TMP_DIR/node-fallback.mjs"
  cat >"$node_fallback_script" <<'NODE'
import net from "node:net";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (args.length > 0 && typeof args[0] === "number") {
    if (args.length === 1) {
      return originalListen.call(this, args[0], "127.0.0.1");
    }
    if (typeof args[1] === "function") {
      return originalListen.call(this, args[0], "127.0.0.1", args[1]);
    }
    if (args[1] && typeof args[1] === "object") {
      return originalListen.call(this, args[0], { ...args[1], host: "127.0.0.1" });
    }
  }
  return originalListen.apply(this, args);
};

await import(pathToFileURL(resolve("./server.js")).href);
NODE
  PORT="$ACTIVE_FALLBACK_PORT" node "$node_fallback_script" >"$NODE_LOG" 2>&1 &
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
    -H "authorization: Bearer ${RUNTIME_AUTH_TOKEN}" \
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
  local diagnostics_section="$2"
  local compose_section="$3"
  local fallback_section="$4"
  local jwks_section="$5"
  local verify_section="$6"
  local compose_log_text="$7"
  local node_log_text="$8"
  local bind_probe_text="$9"
  local end_at
  end_at="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"

  cat >"$REPORT_PATH" <<EOF
# Runtime Proof Report - $REPORT_DATE

## Scope
- Goal: capture staging runtime proof with compose-first execution and node fallback.
- Workspace: $ROOT
- Validation date: $REPORT_DATE (KST)
- Start: $START_AT
- End: $end_at
- Executor: Backend/Ops Worker B

## Execution Summary
| Path | Command | Result | Notes |
| --- | --- | --- | --- |
$diagnostics_section
$compose_section
$fallback_section

## Runtime Diagnostic Codes
- \`RUNTIME_OK\`: the stage passed and the next stage may run.
- \`DOCKER_MISSING\`: \`docker\` is not on \`PATH\`; daemon and compose checks are skipped.
- \`DAEMON_DOWN\`: \`docker\` exists, but the daemon is not reachable.
- \`COMPOSE_MISSING\`: \`docker\` works, but \`docker compose\` is unavailable.
- \`FALLBACK_ONLY\`: compose-first proof was not used; node fallback produced the runtime evidence.

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
4. If the code is \`DOCKER_MISSING\`, install or relink Docker first; if \`DAEMON_DOWN\`, start Colima or Docker Desktop; if \`COMPOSE_MISSING\`, install the compose plugin and rerun.

## Verdict
- Overall verdict: $report_verdict

## Logs
### Runtime Diagnostics
\`\`\`text
$DOCKER_STATUS_LINE
$DAEMON_STATUS_LINE
$COMPOSE_PLUGIN_STATUS_LINE
$FALLBACK_STATUS_LINE
\`\`\`

### Docker CLI Snapshot
\`\`\`text
$DOCKER_VERSION_OUTPUT
\`\`\`

### Docker Daemon Snapshot
\`\`\`text
$DOCKER_INFO_OUTPUT
\`\`\`

### Docker Compose Snapshot
\`\`\`text
$DOCKER_COMPOSE_VERSION_OUTPUT
\`\`\`

### Compose Attempt
\`\`\`text
$compose_log_text
\`\`\`

### Node Fallback
\`\`\`text
$node_log_text
\`\`\`

### Bind Probe
\`\`\`text
$bind_probe_text
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

probe_runtime || true

if [[ "$DOCKER_STATUS" == "RUNTIME_OK" && "$DAEMON_STATUS" == "RUNTIME_OK" && "$COMPOSE_PLUGIN_STATUS" == "RUNTIME_OK" ]]; then
  if run_compose_attempt; then
    VERDICT="PASS"
    FALLBACK_STATUS="RUNTIME_OK"
    FALLBACK_REASON="not needed"
  else
    COMPOSE_ATTEMPT_REASON="${FAILURE_REASON:-compose unavailable or failed}"
    FALLBACK_REASON="${FAILURE_REASON:-compose unavailable or failed}"
    if [[ "$COMPOSE_UP_ATTEMPTED" -eq 1 && "$COMPOSE_UP_SUCCESS" -eq 1 && -z "$COMPOSE_HEALTH_SUMMARY" ]]; then
      FAILURE_REASON="${FAILURE_REASON:-compose startup completed but runtime checks failed}"
    else
      FAILURE_REASON="${FAILURE_REASON:-compose unavailable or failed}"
    fi
    if [[ "$COMPOSE_UP_SUCCESS" -eq 1 ]] && command -v docker >/dev/null 2>&1; then
      docker compose -f "$COMPOSE_FILE" down >"$COMPOSE_DOWN_LOG" 2>&1 || true
      COMPOSE_UP_SUCCESS=0
    fi
    if run_node_fallback; then
      VERDICT="PARTIAL PASS"
      FALLBACK_STATUS="FALLBACK_ONLY"
      FALLBACK_REASON="compose-first proof failed; node fallback succeeded"
    else
      capture_bind_probe || true
      VERDICT="BLOCK"
      FALLBACK_STATUS="FALLBACK_ONLY"
      if [[ -n "$BIND_PROBE_OUTPUT" ]]; then
        FALLBACK_REASON="$BIND_PROBE_OUTPUT"
      fi
    fi
  fi
else
  FALLBACK_STATUS="FALLBACK_ONLY"
  case "$DOCKER_STATUS/$DAEMON_STATUS/$COMPOSE_PLUGIN_STATUS" in
    DOCKER_MISSING/*/*)
      FAILURE_REASON="docker CLI not found on PATH"
      ;;
    RUNTIME_OK/DAEMON_DOWN/*)
      FAILURE_REASON="docker daemon is not reachable"
      ;;
    RUNTIME_OK/RUNTIME_OK/COMPOSE_MISSING)
      FAILURE_REASON="docker compose plugin is unavailable"
      ;;
    *)
      FAILURE_REASON="runtime preflight failed"
      ;;
  esac
  COMPOSE_ATTEMPT_REASON="$FAILURE_REASON"
  FALLBACK_REASON="$FAILURE_REASON"
  if run_node_fallback; then
    VERDICT="PARTIAL PASS"
    FALLBACK_REASON="preflight blocked compose-first proof; node fallback succeeded"
  else
    capture_bind_probe || true
    VERDICT="BLOCK"
    if [[ -n "$BIND_PROBE_OUTPUT" ]]; then
      FALLBACK_REASON="$BIND_PROBE_OUTPUT"
    fi
  fi
fi

compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | $([[ "$COMPOSE_UP_SUCCESS" -eq 1 ]] && echo PASS || echo FAIL) | ${COMPOSE_EXIT:-0} / ${COMPOSE_CHECK_EXIT:-0}"
if [[ "$COMPOSE_UP_ATTEMPTED" -eq 1 && "$COMPOSE_UP_SUCCESS" -eq 1 ]]; then
  compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | PASS | health=${COMPOSE_HEALTH_SUMMARY:-container_started}"
else
  compose_section="- Compose first attempt | \`docker compose -f deploy/docker-compose.staging.yml up -d --build\` | FAIL | ${COMPOSE_ATTEMPT_REASON:-${FAILURE_REASON:-compose unavailable}}"
fi

node_fallback_command_text="PORT=${ACTIVE_FALLBACK_PORT} node \"$TMP_DIR/node-fallback.mjs\""
fallback_health_note="health=not_started"
fallback_result="FAIL"
if [[ "$NODE_STARTED" -eq 1 ]]; then
  if [[ "$NODE_HEALTH_OK" -eq 1 ]]; then
    fallback_health_note="health=process_up"
    if [[ "$VERIFY_CODE" == "201" ]]; then
      fallback_result="PASS"
    fi
  else
    fallback_health_note="health=unready"
  fi
elif [[ "${FALLBACK_STATUS:-}" == "RUNTIME_OK" ]]; then
  fallback_health_note="health=not_needed"
  fallback_result="SKIPPED"
fi
fallback_section="- Node fallback | \`${node_fallback_command_text}\` | ${fallback_result} | ${fallback_health_note}, jwks=${JWKS_CODE:-n/a}, verify=${VERIFY_CODE:-n/a}, code=${FALLBACK_STATUS:-FALLBACK_ONLY}"

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
  node_log_text="(node fallback log empty)"
fi

bind_probe_text="${BIND_PROBE_OUTPUT:-((bind probe not executed))}"

DOCKER_STATUS_LINE="RUNTIME_DIAG docker=${DOCKER_STATUS:-UNKNOWN} note=${DOCKER_BIN_PATH:-unknown}"
DAEMON_STATUS_LINE="RUNTIME_DIAG daemon=${DAEMON_STATUS:-UNKNOWN} note=${DOCKER_INFO_OUTPUT:-unknown}"
COMPOSE_PLUGIN_STATUS_LINE="RUNTIME_DIAG compose=${COMPOSE_PLUGIN_STATUS:-UNKNOWN} note=${DOCKER_COMPOSE_VERSION_OUTPUT:-unknown}"
FALLBACK_STATUS_LINE="RUNTIME_DIAG fallback=${FALLBACK_STATUS:-UNKNOWN} note=${FALLBACK_REASON:-unknown}"

DOCKER_NOTE="${DOCKER_VERSION_OUTPUT%%$'\n'*}"
DAEMON_NOTE="${DOCKER_INFO_OUTPUT%%$'\n'*}"
COMPOSE_NOTE="${DOCKER_COMPOSE_VERSION_OUTPUT%%$'\n'*}"

diagnostics_section="- Docker CLI check | \`command -v docker\` | ${DOCKER_STATUS:-UNKNOWN} | ${DOCKER_NOTE:-unknown}
- Docker daemon check | \`docker info\` | ${DAEMON_STATUS:-UNKNOWN} | ${DAEMON_NOTE:-unknown}
- Compose plugin check | \`docker compose version\` | ${COMPOSE_PLUGIN_STATUS:-UNKNOWN} | ${COMPOSE_NOTE:-unknown}
- Fallback path | \`${node_fallback_command_text}\` | ${FALLBACK_STATUS:-UNKNOWN} | ${FALLBACK_REASON:-unknown}"

printf '%s\n' "$DOCKER_STATUS_LINE"
printf '%s\n' "$DAEMON_STATUS_LINE"
printf '%s\n' "$COMPOSE_PLUGIN_STATUS_LINE"
printf '%s\n' "$FALLBACK_STATUS_LINE"

write_report "$VERDICT" "$diagnostics_section" "$compose_section" "$fallback_section" "$jwks_section" "$verify_section" "$compose_log_text" "$node_log_text" "$bind_probe_text"

printf 'runtime proof report written to %s\n' "$REPORT_PATH"
printf 'overall verdict: %s\n' "$VERDICT"

if [[ "$VERDICT" == "BLOCK" ]]; then
  exit 1
fi

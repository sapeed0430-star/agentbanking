#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEFAULT_ENV_FILE="$ROOT/.env"
if [[ -f "$DEFAULT_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DEFAULT_ENV_FILE"
  set +a
fi

ADMIN_MIN_LENGTH=24
AUDIT_ADMIN_TOKEN="${AUDIT_ADMIN_TOKEN:-}"
RUNTIME_PROOF_AUTH_TOKEN="${RUNTIME_PROOF_AUTH_TOKEN:-$AUDIT_ADMIN_TOKEN}"
AUDIT_SIGNER_PRIVATE_KEY_PATH="${AUDIT_SIGNER_PRIVATE_KEY_PATH:-$ROOT/.keys/live-proof-ed25519-private.pem}"
AUDIT_SIGNER_PUBLIC_KEY_PATH="${AUDIT_SIGNER_PUBLIC_KEY_PATH:-$ROOT/.keys/live-proof-ed25519-public.pem}"
PROOF_SUITE_REKOR_KEY_SOURCE="${PROOF_SUITE_REKOR_KEY_SOURCE:-signer-public-key-path}"
LIVE_OUTPUT_PATH="${LIVE_OUTPUT_PATH:-$ROOT/docs/week2/backend/evidence/live-proof-$(date -u '+%Y-%m-%dT%H-%M-%SZ').json}"
RUNTIME_REPORT_PATH="${RUNTIME_REPORT_PATH:-$ROOT/docs/week2/backend/runtime-proof-2026-03-24.md}"

AUDIT_RFC3161_ENDPOINT="${AUDIT_RFC3161_ENDPOINT:-}"
AUDIT_REKOR_BASE_URL="${AUDIT_REKOR_BASE_URL:-}"
RUNTIME_AUDIT_SIGNER_MODE="${RUNTIME_AUDIT_SIGNER_MODE:-mock}"
RUNTIME_AUDIT_TIMESTAMP_MODE="${RUNTIME_AUDIT_TIMESTAMP_MODE:-mock}"
RUNTIME_AUDIT_TRANSPARENCY_MODE="${RUNTIME_AUDIT_TRANSPARENCY_MODE:-mock}"

LIVE_EXIT=0
RUNTIME_EXIT=0
LIVE_RESULT="UNKNOWN"
RUNTIME_RESULT="UNKNOWN"
LIVE_RAN=0
RUNTIME_RAN=0
SIGNER_PRIVATE_KEY_PEM=""
REKOR_PUBLIC_KEY_PEM_B64=""

declare -a FAILURES=()
declare -a WARNINGS=()

pass() {
  printf '[PASS] %s\n' "$1"
}

warn() {
  WARNINGS+=("$1")
  printf '[WARN] %s\n' "$1"
}

fail() {
  FAILURES+=("$1")
  printf '[FAIL] %s\n' "$1"
}

validate_admin_token() {
  if [[ -z "$AUDIT_ADMIN_TOKEN" ]]; then
    fail "AUDIT_ADMIN_TOKEN is required"
    return
  fi
  if [[ ${#AUDIT_ADMIN_TOKEN} -lt "$ADMIN_MIN_LENGTH" ]]; then
    fail "AUDIT_ADMIN_TOKEN must be at least ${ADMIN_MIN_LENGTH} chars (current: ${#AUDIT_ADMIN_TOKEN})"
    return
  fi
  pass "AUDIT_ADMIN_TOKEN length check (${#AUDIT_ADMIN_TOKEN})"
}

validate_signer_key_path() {
  if [[ ! -f "$AUDIT_SIGNER_PRIVATE_KEY_PATH" ]]; then
    fail "signer private key path not found: $AUDIT_SIGNER_PRIVATE_KEY_PATH"
    return
  fi
  if [[ ! -r "$AUDIT_SIGNER_PRIVATE_KEY_PATH" ]]; then
    fail "signer private key path is not readable: $AUDIT_SIGNER_PRIVATE_KEY_PATH"
    return
  fi

  SIGNER_PRIVATE_KEY_PEM="$(cat "$AUDIT_SIGNER_PRIVATE_KEY_PATH")"
  if [[ -z "$SIGNER_PRIVATE_KEY_PEM" ]]; then
    fail "signer private key is empty: $AUDIT_SIGNER_PRIVATE_KEY_PATH"
    return
  fi

  pass "signer private key path check ($AUDIT_SIGNER_PRIVATE_KEY_PATH)"
}

validate_rekor_key_source() {
  case "$PROOF_SUITE_REKOR_KEY_SOURCE" in
    signer-public-key-path)
      if [[ ! -f "$AUDIT_SIGNER_PUBLIC_KEY_PATH" ]]; then
        fail "signer public key path not found: $AUDIT_SIGNER_PUBLIC_KEY_PATH"
        return
      fi
      if [[ ! -r "$AUDIT_SIGNER_PUBLIC_KEY_PATH" ]]; then
        fail "signer public key path is not readable: $AUDIT_SIGNER_PUBLIC_KEY_PATH"
        return
      fi
      REKOR_PUBLIC_KEY_PEM_B64="$(base64 < "$AUDIT_SIGNER_PUBLIC_KEY_PATH" | tr -d '\n')"
      if [[ -z "$REKOR_PUBLIC_KEY_PEM_B64" ]]; then
        fail "failed to derive base64 from signer public key path: $AUDIT_SIGNER_PUBLIC_KEY_PATH"
        return
      fi
      pass "rekor key source check (signer-public-key-path)"
      ;;
    env)
      REKOR_PUBLIC_KEY_PEM_B64="${AUDIT_REKOR_PUBLIC_KEY_PEM_B64:-}"
      if [[ -z "$REKOR_PUBLIC_KEY_PEM_B64" ]]; then
        fail "AUDIT_REKOR_PUBLIC_KEY_PEM_B64 is required when PROOF_SUITE_REKOR_KEY_SOURCE=env"
        return
      fi
      pass "rekor key source check (env)"
      ;;
    *)
      fail "invalid PROOF_SUITE_REKOR_KEY_SOURCE: $PROOF_SUITE_REKOR_KEY_SOURCE (allowed: signer-public-key-path, env)"
      ;;
  esac
}

validate_live_endpoint_env() {
  if [[ -z "$AUDIT_RFC3161_ENDPOINT" ]]; then
    fail "AUDIT_RFC3161_ENDPOINT is required for live proof"
  else
    pass "AUDIT_RFC3161_ENDPOINT is set"
  fi

  if [[ -z "$AUDIT_REKOR_BASE_URL" ]]; then
    fail "AUDIT_REKOR_BASE_URL is required for live proof"
  else
    pass "AUDIT_REKOR_BASE_URL is set"
  fi
}

recommend_runtime_auth_token_match() {
  if [[ -z "$RUNTIME_PROOF_AUTH_TOKEN" ]]; then
    RUNTIME_PROOF_AUTH_TOKEN="$AUDIT_ADMIN_TOKEN"
    warn "RUNTIME_PROOF_AUTH_TOKEN was empty; aligned to AUDIT_ADMIN_TOKEN for runtime proof"
    return
  fi

  if [[ "$RUNTIME_PROOF_AUTH_TOKEN" != "$AUDIT_ADMIN_TOKEN" ]]; then
    warn "recommended: set RUNTIME_PROOF_AUTH_TOKEN equal to AUDIT_ADMIN_TOKEN"
  else
    pass "runtime auth token recommendation satisfied (RUNTIME_PROOF_AUTH_TOKEN == AUDIT_ADMIN_TOKEN)"
  fi
}

print_summary() {
  local overall_status="$1"
  local live_line="NOT_RUN"
  local runtime_line="NOT_RUN"

  if [[ "$LIVE_RAN" -eq 1 ]]; then
    live_line="$( [[ "$LIVE_EXIT" -eq 0 ]] && echo PASS || echo FAIL )"
  fi
  if [[ "$RUNTIME_RAN" -eq 1 ]]; then
    runtime_line="$( [[ "$RUNTIME_EXIT" -eq 0 ]] && echo PASS || echo FAIL )"
  fi

  printf '\n=== Proof Suite Summary ===\n'
  printf 'Overall: %s\n' "$overall_status"
  printf 'Live proof: %s (result=%s, output=%s)\n' "$live_line" "$LIVE_RESULT" "$LIVE_OUTPUT_PATH"
  printf 'Runtime proof: %s (result=%s, report=%s)\n' "$runtime_line" "$RUNTIME_RESULT" "$RUNTIME_REPORT_PATH"

  if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    printf '\nWarnings:\n'
    for item in "${WARNINGS[@]}"; do
      printf ' - %s\n' "$item"
    done
  fi

  if [[ ${#FAILURES[@]} -gt 0 ]]; then
    printf '\nValidation errors:\n'
    for item in "${FAILURES[@]}"; do
      printf ' - %s\n' "$item"
    done
  fi
}

run_live_proof() {
  printf '\n[RUN] live proof capture\n'
  LIVE_RAN=1

  set +e
  AUDIT_SIGNER_MODE="local-ed25519" \
  AUDIT_TIMESTAMP_MODE="rfc3161" \
  AUDIT_TRANSPARENCY_MODE="rekor" \
  AUDIT_SIGNER_PRIVATE_KEY_PEM="$SIGNER_PRIVATE_KEY_PEM" \
  AUDIT_REKOR_PUBLIC_KEY_PEM_B64="$REKOR_PUBLIC_KEY_PEM_B64" \
  node "$ROOT/scripts/capture-live-proof-evidence.js" --output "$LIVE_OUTPUT_PATH"
  LIVE_EXIT=$?
  set -e

  if [[ -f "$LIVE_OUTPUT_PATH" ]]; then
    LIVE_RESULT="$(node --input-type=module -e '
      import fs from "node:fs";
      const path = process.argv[1];
      try {
        const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
        process.stdout.write(String(parsed?.result?.outcome || "UNKNOWN"));
      } catch {
        process.stdout.write("UNKNOWN");
      }
    ' "$LIVE_OUTPUT_PATH")"
  fi
}

run_runtime_proof() {
  printf '\n[RUN] runtime proof capture\n'
  RUNTIME_RAN=1
  set +e
  REPORT_PATH="$RUNTIME_REPORT_PATH" \
  RUNTIME_PROOF_AUTH_TOKEN="$RUNTIME_PROOF_AUTH_TOKEN" \
  AUDIT_ADMIN_TOKEN="$AUDIT_ADMIN_TOKEN" \
  AUDIT_SIGNER_MODE="$RUNTIME_AUDIT_SIGNER_MODE" \
  AUDIT_TIMESTAMP_MODE="$RUNTIME_AUDIT_TIMESTAMP_MODE" \
  AUDIT_TRANSPARENCY_MODE="$RUNTIME_AUDIT_TRANSPARENCY_MODE" \
  AUDIT_SIGNER_PRIVATE_KEY_PEM="" \
  AUDIT_REKOR_PUBLIC_KEY_PEM_B64="" \
  STAGING_API_PORT="${STAGING_API_PORT:-3210}" \
  bash "$ROOT/scripts/capture-runtime-proof.sh"
  RUNTIME_EXIT=$?
  set -e

  if [[ -f "$RUNTIME_REPORT_PATH" ]]; then
    RUNTIME_RESULT="$(awk -F': ' '/Overall verdict:/ {print $2; exit}' "$RUNTIME_REPORT_PATH" | tr -d '\r')"
    if [[ -z "$RUNTIME_RESULT" ]]; then
      RUNTIME_RESULT="UNKNOWN"
    fi
  fi
}

printf '[INFO] proof suite start (%s)\n' "$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"
printf '[INFO] workspace: %s\n' "$ROOT"

validate_admin_token
validate_signer_key_path
validate_rekor_key_source
validate_live_endpoint_env
recommend_runtime_auth_token_match

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  print_summary "FAIL"
  exit 1
fi

run_live_proof
run_runtime_proof

if [[ "$LIVE_EXIT" -eq 0 && "$RUNTIME_EXIT" -eq 0 ]]; then
  print_summary "PASS"
  exit 0
fi

print_summary "FAIL"
exit 1

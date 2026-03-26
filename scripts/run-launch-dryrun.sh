#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DATE_KST="$(TZ=Asia/Seoul date '+%Y-%m-%d')"
START_AT_KST="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')"
REPORT_PATH="${REPORT_PATH:-$ROOT/docs/week2/operations/launch-dryrun-${REPORT_DATE_KST}.md}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/launch-dryrun.XXXXXX")"

RESULT_CONTRACT="FAIL"
RESULT_EVIDENCE="FAIL"
RESULT_INTEGRATION="FAIL"
RESULT_TEST="FAIL"

LOG_CONTRACT="$TMP_DIR/contract.log"
LOG_EVIDENCE="$TMP_DIR/evidence.log"
LOG_INTEGRATION="$TMP_DIR/integration.log"
LOG_TEST="$TMP_DIR/test.log"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

run_step() {
  local cmd="$1"
  local log="$2"
  set +e
  bash -lc "$cmd" >"$log" 2>&1
  local code=$?
  set -e
  echo "$code"
}

summarize_log() {
  local log="$1"
  sed -n '1,12p' "$log" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g'
}

mkdir -p "$(dirname "$REPORT_PATH")"

code_contract="$(run_step "cd '$ROOT' && npm run check:contract" "$LOG_CONTRACT")"
if [[ "$code_contract" -eq 0 ]]; then
  RESULT_CONTRACT="PASS"
fi

code_evidence="$(run_step "cd '$ROOT' && npm run check:evidence" "$LOG_EVIDENCE")"
if [[ "$code_evidence" -eq 0 ]]; then
  RESULT_EVIDENCE="PASS"
fi

code_integration="$(run_step "cd '$ROOT' && npm run check:integration" "$LOG_INTEGRATION")"
if [[ "$code_integration" -eq 0 ]]; then
  RESULT_INTEGRATION="PASS"
fi

code_test="$(run_step "cd '$ROOT' && npm test" "$LOG_TEST")"
if [[ "$code_test" -eq 0 ]]; then
  RESULT_TEST="PASS"
fi

OVERALL="PASS"
if [[ "$RESULT_CONTRACT" != "PASS" || "$RESULT_EVIDENCE" != "PASS" || "$RESULT_INTEGRATION" != "PASS" || "$RESULT_TEST" != "PASS" ]]; then
  OVERALL="BLOCK"
fi

cat >"$REPORT_PATH" <<EOF
# Launch Dry Run Report - ${REPORT_DATE_KST} (KST)

## Run Context
- started_at: ${START_AT_KST}
- report_path: ${REPORT_PATH}
- objective: 2026-03-30 Go-Live rehearsal prerequisite verification

## Execution Summary
| Check | Command | Result |
|---|---|---|
| Contract | \`npm run check:contract\` | ${RESULT_CONTRACT} |
| Evidence Integrity | \`npm run check:evidence\` | ${RESULT_EVIDENCE} |
| Integration Stability | \`npm run check:integration\` | ${RESULT_INTEGRATION} |
| Regression Tests | \`npm test\` | ${RESULT_TEST} |

## Final Verdict
- overall: \`${OVERALL}\`

## Key Log Snippets
1. Contract: $(summarize_log "$LOG_CONTRACT")
2. Evidence: $(summarize_log "$LOG_EVIDENCE")
3. Integration: $(summarize_log "$LOG_INTEGRATION")
4. Test: $(summarize_log "$LOG_TEST")

## Follow-up Rule
1. Any non-PASS check keeps launch dry run gate locked.
2. Team Lead must approve only when all checks are PASS.
EOF

echo "report: $REPORT_PATH"
echo "overall: $OVERALL"
if [[ "$OVERALL" != "PASS" ]]; then
  exit 1
fi

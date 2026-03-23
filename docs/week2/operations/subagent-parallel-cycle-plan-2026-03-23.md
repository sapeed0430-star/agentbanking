# Sub-Agent Parallel Cycle Plan (Starting Next Cycle)

## 1) Operating Model
1. All domain sub-agents run in parallel lanes: Research, Backend, Frontend, Design, Marketing.
2. Team Lead agent is the single gatekeeper.
3. Hourly cadence (KST):
- `:50` each lane submits checkpoint + evidence
- `:00` Team Lead issues verdict (`PASS` / `PARTIAL PASS` / `BLOCK`)
4. Next-task lock rule:
- Each lane can start next queued task only after Team Lead `PASS`
- `PARTIAL PASS` allows only scoped continuation noted by Team Lead
- `BLOCK` stops lane progression until blocker is closed and re-validated

## 2) Lane Ownership Re-Check (This Cycle Start)
| Lane | Owner Scope | Current Status | Next Task ID | Gate Condition |
|---|---|---|---|---|
| Research | 규제 매핑 + 표준 채택 근거 | PARTIAL | R-01 | Team Lead PASS |
| Backend | RFC3161/Rekor/TSA 연동 강화 + offline verifier 고도화 | PASS | B-01 | Team Lead PASS |
| Frontend | 422 무결성 실패 패널 + 오퍼레이터 액션 UI | PARTIAL | F-01 | Team Lead PASS |
| Design | 무결성 severity 시각체계 + 모바일 320px | PARTIAL | D-01 | Team Lead PASS |
| Marketing | ICP/요금제 신뢰 메시지 보강 | PARTIAL | M-01 | Team Lead PASS |
| Team Lead | 게이트 판정/차단 해소/SLA 집행 | PASS | TL-01 | N/A |

## 3) Task Queue (Parallel Start Batch)
### Research (R-01)
- Deliverable:
  - `docs/week1/research/regulatory-mapping-v1.md` 업데이트
- Exit criteria:
  - unresolved 항목 owner/due/date 명시

### Backend (B-01)
- Deliverable:
  - TSA/Rekor staging integration test doc+code
- Exit criteria:
  - 실신뢰재료 기반 검증 로그 1세트

### Frontend (F-01)
- Deliverable:
  - `docs/week1/frontend/receipt-detail-mockup.html` 422 상태 패널 반영
- Exit criteria:
  - error code -> UI state 1:1 매핑

### Design (D-01)
- Deliverable:
  - `docs/week1/design/wireframes.md` 무결성 상태 화면 보강
- Exit criteria:
  - critical/high/medium/low 구분 + 모바일 대응

### Marketing (M-01)
- Deliverable:
  - `docs/week1/marketing/icp-pricing-onepager.md` 신뢰/감사 가치 문구 개정
- Exit criteria:
  - 기능-가치 매핑 문장 명시, 과장 문구 제거

## 4) Team Lead Validation Checklist (Hourly)
1. Evidence path exists and is readable.
2. Deliverable meets lane exit criteria.
3. No unresolved blocker without owner/due/next update time.
4. Verdict and rationale recorded.
5. Only `PASS` lanes receive next task assignment.

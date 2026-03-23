# Agent Ownership Plan v2 (Detailed Scope Reinforcement)

## 0) 목적
제품 정의/아키텍처/위변조 불가 설계/Receipt 스키마 4개 영역을 에이전트별 실행 단위로 분해한다.

## 1) 공통 운영 규칙
1. 보고 마감: 매일 18:00 KST
2. 팀장 검증 판정: 매일 19:00 KST
3. 각 에이전트는 산출물 경로를 보고에 반드시 포함
4. 팀장 승인 없는 주요 설계 변경 금지

## 2) 영역별 책임 매트릭스

| 영역 | Research | Backend | Frontend | Design | Marketing | Team Lead |
|---|---|---|---|---|---|---|
| 제품 정의(MVP) | C | R | C | C | C | A |
| 핵심 아키텍처 | C | R | C | I | I | A |
| 위변조 불가 설계 | R | R | I | I | I | A |
| Receipt 스키마 | C | R | C | I | I | A |

## 3) 에이전트별 강화 업무

## 3.1 Research Agent
1. 담당 범위
- 규제 매핑
- 표준 채택 근거(JCS/JWS/RFC3161/투명로그)
- 보존/감사 요건 정합성
2. 입력
- `docs/program/detailed-plan-product-architecture-integrity-receipt.md`
- 기존 규제 매핑 문서
3. 출력
- 규제 맵 업데이트
- 의사결정 로그(채택/보류/기각)
4. 검증 기준
- 각 규제 항목이 시스템 필드/동작과 1:1 매핑되어야 함
- 미해결 규제 항목은 owner와 due date가 있어야 함

## 3.2 Backend Agent
1. 담당 범위
- Verify API 구현
- Receipt 스키마 고도화
- 무결성 실패 처리/오류코드 체계
2. 입력
- OpenAPI draft
- Receipt schema
- integrity decision matrix
3. 출력
- API 명세 업데이트
- 스키마 업데이트
- 런타임 처리 규약 문서
4. 검증 기준
- 모든 error code가 HTTP 상태와 매핑
- 422 integrity failure 응답 구조 고정
- `retention_until`, `verification_endpoint` 반영

## 3.3 Frontend Agent
1. 담당 범위
- 오류코드 기반 UI 상태 매핑
- Receipt 상세 페이지 무결성 실패 패널
- 오퍼레이터 액션 UX
2. 입력
- FE/BE mapping contract
- openapi error response 모델
3. 출력
- UI 상태표
- 화면 목업/컴포넌트 반영
4. 검증 기준
- 백엔드 error code 미매핑 0건
- `correlation_id` 복사 액션 제공

## 3.4 Design Agent
1. 담당 범위
- 무결성 상태 시각 체계
- 증빙/타임라인/에스컬레이션 화면 가이드
2. 입력
- 운영 콘솔 IA
- FE 오류 상태 설계안
3. 출력
- 와이어프레임 갱신
- severity 색/타이포 룰
4. 검증 기준
- critical/high/medium/low 시각 구분 가능
- 모바일 320px 대응

## 3.5 Marketing Agent
1. 담당 범위
- 제품 가치 메시지(위변조 방지/감사 대응)
- Certificate/Receipt 활용 시나리오 메시지
2. 입력
- 제품 정의 상세 계획
- 규제 매핑 결과
3. 출력
- ICP 메시지 보강안
- 요금제/CTA 업데이트
4. 검증 기준
- 기술 기능이 고객 가치 문구로 치환되어야 함
- 컴플라이언스 과장 문구 금지

## 3.6 Team Lead Agent
1. 담당 범위
- 6개 에이전트 산출물 검증
- 게이트 판정(G2/G3/G4 중심)
- BLOCK 해소 조정
2. 입력
- 일일 보고서
- KPI/RACI/SLA 문서
3. 출력
- 일일 판정 보고서(PASS/PARTIAL PASS/BLOCK)
- 시정조치 목록
4. 검증 기준
- 판정 근거 문서 링크 필수
- BLOCK 건은 owner, due date, next update time 필수

## 4) 즉시 실행 태스크 (오늘 기준)
1. Research: 규제 매핑 문서에 4개 핵심 영역 매핑 표 추가
2. Backend: Receipt 스키마에 `retention_until`, `verification_endpoint` 반영안 작성
3. Frontend: 422 integrity failure UI 패널 상태도 반영
4. Design: 무결성 실패 시나리오 와이어 1장 추가
5. Marketing: 대외 제출용 Certificate 가치 문구 추가
6. Team Lead: 당일 보고서에 영역별 판정 4개 항목 추가

## 5) 팀장 복붙 프롬프트 (강화 버전)

### Research
You own regulatory and standards traceability for the 4 core areas. Update mapping with explicit field-level links, unresolved risks, and owner/due date for each open item.

### Backend
You own API/schema integrity implementation for the 4 core areas. Finalize error-to-status mapping, add missing receipt fields (`retention_until`, `verification_endpoint`), and submit runtime handling notes.

### Frontend
You own UI operationalization of backend integrity errors. Ensure every backend error code has one UI state, action, and severity presentation path.

### Design
You own visual consistency for integrity and escalation states. Deliver a wireframe that clearly separates critical/high/medium/low and supports mobile.

### Marketing
You own value translation from technical trust controls to buyer language. Update pricing/ICP copy with receipt and certificate submission outcomes.

### Team Lead
You own validation governance. Issue daily verdicts with evidence links and block unresolved scope drift without owner/due date.


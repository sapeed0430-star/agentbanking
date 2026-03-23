# Week 2 Execution Pack

목표: Week 1 산출물을 실제 구현 파트와 연동해 **API 스펙 확정**, **운영 화면 정합성** 및 **출시 전 보안 증적 체계**를 완성한다.
운영 상태 추적은 주차 요약이 아니라 일일 보고서를 단일 기준으로 사용한다.

## 1) 우선순위와 산출물
1. 설계 고정
   - `receipt-1.0.0.schema.json` 스키마 검토/판정 규칙 고도화
   - `openapi-draft.yaml`를 `verify`/`receipts` API 실제 동작 규격으로 확정
2. 보안 증적
   - 감사증적 타임스탬프 정책 초안 작성 (Roughtime/외부 TSA/내부 타임 소스)
   - JCS/JWS/JWT header policy + nonce 정책 확정
3. 운영 화면
- Receipt 상세 화면 목업을 운영 플로우 중심으로 재정의
4. 수익화 운영
   - 1주차 ICP/요금안 기반으로 청구 로직 가정치 확정

## 2) 세부 작업표

### 팀별 업무(월~금, 1차 스프린트)

1. 리서치 에이전트
   - Week 1 규제 매핑에 대한 변경 사항 반영
   - 미국/글로벌 증권/금융 규제 업데이트 체크(증빙 보존, 로그 불변성, 고객 동의)
   - 증적 무결성 2차 위험 평가표 작성

2. 백엔드 에이전트
   - `POST /verify` 바디 예시 5개 케이스 정리
     - 정상, 위조 시도, 만료 토큰, 서명 미검증, 중복 요청
   - `GET /receipts/{id}` 권한 정책 및 오류코드 세트 정의
   - 검증 결과 영구저장 정책(보관 기간, soft-delete, 정합성 해시) 확정

3. 프론트엔드 에이전트
   - 운영 콘솔 IA를 기준으로 다음 화면 1차 구현
     - 로그인/역할 전환
     - Receipt 목록, 상세, 검색 결과 상태 뱃지
   - API 응답 스키마에 맞는 타입 정의 초안 작성

4. 디자인 에이전트
   - 디자인 토큰을 실제 페이지 컴포넌트로 매핑
   - 1차 화면에서 모바일 반응형 검토 기준 적용(최소 320px)
   - 팀 표준으로 컬러/폰트/간격 룰북 발행

5. 마케팅 에이전트
   - Week 2 기준 가격제안 문안 확정(요금제별 CTA 문구)
   - 온보딩 랜딩/세일즈 데크용 1페이지 버전 정리

6. 팀장
   - 주간 DOR/DOD 리뷰 회의
   - 코드 리뷰/병합 조건(체크리스트) 실행 점검
   - 인증 실패 이슈(예: Git push auth) 대응 로그 관리

## 3) 매일 운영 루틴
1. 오전 10분: 각 에이전트 진행률 동기화
2. 점심 전: 리스크 핫스팟 1개 이상 해소
3. 퇴근 전: 산출물 1개 이상 리뷰 가능한 형태로 마감

## 4) 완료 기준(Week 2 Exit Criteria)
1. openapi-draft에 POST/GET 엔드포인트가 테스트 시나리오와 매핑 완료
2. 팀 콘솔 Receipt 상세 화면 목업이 운영 시나리오와 연결
3. 보안/컴플라이언스 리스크 레지스터 업데이트 반영
4. 원격 브랜치 상태가 `main`, `develop`, `staging`, `release/*`, `hotfix/*` 추적 가능한 상태

## 5) 운영 통제 문서
1. KPI 대시보드: `docs/week2/teamlead/kpi-dashboard-spec.md`
2. RACI/승인 게이트: `docs/week2/teamlead/raci-approval-gates.md`
3. 에스컬레이션 SLA: `docs/week2/teamlead/escalation-sla.md`
4. 일일 보고 템플릿: `docs/week2/operations/daily-report-template.md`
5. 에이전트 업무 분장표: `docs/week2/operations/agent-work-allocation-2026-03-23.md`
6. FE/BE 오류 매핑 계약표: `docs/week2/frontend/error-code-ui-mapping-contract.md`
7. 12주 일일 실행 인덱스: `docs/program/daily-tracking-index.md`
8. 12주 일일 실행 운영계획: `docs/program/12-week-development-plan-daily.md`

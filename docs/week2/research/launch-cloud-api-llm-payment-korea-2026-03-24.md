# Launch Planning (Cloud + API + Verification LLM + KR Payment)

Date: 2026-03-24  
Owner: Research sub-agent

## 1) Assumptions

| 항목 | 가정값 (Low / Base / High) | 비고 |
|---|---|---|
| 환율 | 1 USD = 1,350 KRW | 계획/예산 기준 환율(월별 재산정) |
| 월 검증 요청(verify) | 50,000 / 500,000 / 3,000,000 | Receipt 발급 트래픽 |
| 평균 payload | 25 KB/request | request + metadata 기준 |
| 월 egress | 60 GB / 400 GB / 2,000 GB | API 조회 + 콘솔 사용 포함 |
| 저장 보존 | Hot 90일 + Archive 1년 | 규제/감사 패키지 대응 |
| LLM 적용 비율 | 10% / 25% / 40% | 결정은 deterministic, LLM은 보조 |
| LLM 토큰/건 | 평균 2,000 input + 500 output | 정책 해설/이상탐지 설명 |
| 운영 인력 | 1~2명 온콜 + 1명 보안겸임 | 초기 3개월 기준 |

## 2) Production Launch Architecture (Cloud + API + Verification LLM)

### 2.1 권장 클라우드 토폴로지 (MVP)

| 레이어 | 권장 구성 (AWS 서울 리전 기준) | 목적 |
|---|---|---|
| Edge | CloudFront + WAF + Rate Limit + mTLS 게이트웨이 | DDoS/봇/기본 방어 |
| API Ingress | API Gateway(또는 ALB) + OIDC 검증 + nonce/replay 체크 | 인증/인가, 리플레이 방지 |
| Core Verify | Container(ECS/Fargate) `verify-api`, `receipt-issuer`, `offline-verify-api` | 핵심 검증/발급 |
| Async | SQS + Worker(`timestamp`, `transparency`, `audit-package`) | 외부 연동 분리, 재시도 |
| Data (metadata) | PostgreSQL(Aurora/RDS) | receipt/report 상태, 인덱스 |
| Data (evidence) | S3 Object Lock(WORM) + 버전관리 | 원문 증빙 불변 저장 |
| Crypto | KMS(키 래핑) + HSM/전용 signer(Ed25519 키 격리) | 서명키 보호/회전 |
| Timestamp | RFC3161 TSA 어댑터 (외부 TSA 이중화) | 시간 증명 |
| Transparency | Rekor 어댑터(초기) + Trillian 옵션(확장) | inclusion/consistency proof |
| Observability | OpenTelemetry + Metrics/Logs/Trace + SIEM 연계 | 감사 추적/장애 대응 |
| DR | Multi-AZ + 일 단위 immutable snapshot + 복구 리허설 | 복구 가능성 보장 |

### 2.2 API 서비스 구성 (권장)

| 서비스 | 엔드포인트/기능 | SLO/정책 |
|---|---|---|
| Verification API | `POST /verify` | p95 2s(외부 TSA 포함 3s), 멱등키 필수 |
| Receipt API | `GET /receipts/{id}`, `GET /receipts/{id}/verify` | 조회 p95 500ms |
| Report API | `GET /reports/{id}` | 접근권한 분리(운영자/감사자) |
| Offline Verify API/CLI | `POST /verify/offline`, CLI `verify-receipt` | 표준 벡터 100% 성공 |
| Key/JWKS API | `GET /.well-known/jwks.json`, rotate/revoke admin API | key rotation 정책 강제 |
| Certificate API | `GET /certificates/{receiptId}` | 외부 제출용 최소정보 |

### 2.3 Verification LLM 서비스 구성 (권장 원칙)

| 영역 | LLM 적용 | 금지/가드레일 |
|---|---|---|
| 정책 해석 보조 | 자연어 정책 -> 룰 제안(JSON) | LLM이 최종 PASS/FAIL 결정 금지 |
| 이상징후 설명 | “왜 실패했는지” 운영자용 서술 생성 | 원본 증빙/PII 직접 출력 금지 |
| 감사 패키지 요약 | 감사기관 제출용 요약 초안 | 최종 문서는 deterministic 데이터만 원천 |
| 운영 효율 | 분류/티켓 라우팅/FAQ | 서명/해시/검증 단계 개입 금지 |

LLM 운영 정책:
- 결정권은 `deterministic verifier engine`에만 부여.
- LLM 출력은 반드시 스키마 검증(JSON Schema) 후 저장.
- PII redaction + prompt versioning + output hash 기록.
- 장애 시 LLM 단계는 우회 가능해야 함(핵심 발급 경로 비차단).

## 3) Initial Monthly Budget Model (KRW + USD)

환율 가정: 1 USD = 1,350 KRW

| 비용 항목 | Low (USD/KRW) | Base (USD/KRW) | High (USD/KRW) | 산정 메모 |
|---|---:|---:|---:|---|
| Compute/API | 400 / 540,000 | 1,200 / 1,620,000 | 4,000 / 5,400,000 | API/Worker 오토스케일 |
| DB/Storage/Backup | 250 / 337,500 | 900 / 1,215,000 | 3,000 / 4,050,000 | 증빙 보존 포함 |
| Security/Crypto | 180 / 243,000 | 600 / 810,000 | 1,800 / 2,430,000 | WAF/KMS/HSM/TLS |
| Observability | 120 / 162,000 | 450 / 607,500 | 1,500 / 2,025,000 | 로그/트레이스/SIEM |
| External Proof (TSA/Rekor 운영비) | 100 / 135,000 | 350 / 472,500 | 1,200 / 1,620,000 | 트랜잭션 볼륨 의존 |
| LLM 비용 | 150 / 202,500 | 900 / 1,215,000 | 4,500 / 6,075,000 | 보조 태스크 사용량 |
| 기타(도메인/메일/예비비) | 150 / 202,500 | 600 / 810,000 | 2,000 / 2,700,000 | 10~15% 버퍼 |
| **합계** | **1,350 / 1,822,500** | **5,000 / 6,750,000** | **18,000 / 24,300,000** | 운영비(인건비 제외) |

운영 권고:
- 최초 2개월은 Base 예산 상한(월 700만 KRW 내외)으로 시작.
- 70% 이상 리소스가 2주 지속되면 다음 티어로 승격.
- LLM 예산은 별도 상한(예: 월 150만 KRW) 설정 후 점진 확대.

## 4) Payment Collection Strategy (Korean SaaS Operator)

### 4.1 결제 채널 전략 (국내 + 글로벌)

| 트랙 | 권장 옵션 | 용도 | 장점 | 유의점 |
|---|---|---|---|---|
| 국내(원화/KRW) | Toss Payments, KG Inicis, NHN KCP 중 1개 우선 | 한국 법인 고객 정기과금 | 국내 카드/계좌, 정기결제 친화 | 계약/심사/정산주기 확인 필요 |
| 글로벌(해외카드) | MoR: Paddle 또는 Lemon Squeezy | 해외 셀프서브 구독 | 세금/VAT/GST/환불/청구 대행 | 수수료가 PG 대비 높을 수 있음 |
| 글로벌 대안 | PayPal Subscriptions + 자체 세무 | 특정 국가 고객 보완 | 도달 범위 보완 | 세무/컴플라이언스 내부 부담 증가 |

### 4.2 구독 과금 패턴 (추천)

| 플랜 | 과금 방식 | 포함량 | 초과요금 |
|---|---|---|---|
| Starter | 월 정액 | 월 10,000 verify | 건당 과금 |
| Growth | 월 정액 + 연 할인(15~20%) | 월 100,000 verify | 단계별 단가 할인 |
| Enterprise | 계약형(연간 선결제 + SLA) | 맞춤 | 커밋 기반 |

청구 운영:
- 국내: PG 빌링키 기반 월 자동결제 + 세금계산서 자동 발행(국내 B2B).
- 글로벌: MoR 체크아웃(월/연) + 카드 실패 재시도(dunning 3~5회).
- Entitlement는 “선결제 크레딧 + 사용량 초과” 하이브리드 권장.

### 4.3 정산/통화/세무 운영 노트

| 항목 | 운영 권고 |
|---|---|
| 정산 | 국내 PG 정산주기(T+N) 표준화, 월 마감 리포트 자동 생성 |
| 통화 | KRW(국내) + USD(해외) 이중통화 원장, 월말 환산 손익 분리 |
| 세무 | 국내 공급분 10% VAT 정책 명확화, 해외 판매는 국가별 VAT/GST 책임 주체(MoR vs 직접판매) 분리 |
| 증빙 | 인보이스/영수증/환불전표/정산명세를 고객·회계·감사 용도로 분리 저장 |
| 컴플라이언스 | KYC/AML, 제재국 필터, 환불/차지백 SOP 문서화 |

## 5) Recommended Rollout Order (MVP -> Scale)

| 단계 | 기간(권장) | 목표 | 종료 조건 |
|---|---|---|---|
| Phase 0: Pre-launch | 2주 | 결제/클라우드/보안 공급자 계약, 키정책 확정 | 공급자·키·SLO 문서 승인 |
| Phase 1: MVP GA 후보 | 4주 | `verify + receipt + offline verify` 상용 경로 오픈 | 파일럿 3곳, 발급 성공률 99.5%+ |
| Phase 2: Scale Ready | 4주 | RFC3161/Rekor 실연동, 과금 자동화, 장애복구 리허설 | tamper 탐지 100%, DR 훈련 통과 |
| Phase 3: Growth | 6주 | 멀티리전 준비, 엔터프라이즈 보안옵션, LLM 보조 고도화 | 엔터프라이즈 고객 2곳 온보딩 |

## 6) Key Risks and Mitigations

| 리스크 | 영향 | 대응책 |
|---|---|---|
| 단일 리전 장애 | 발급 중단/지연 | Multi-AZ + warm standby + DR runbook 월 1회 |
| 서명키 보안 이슈 | 신뢰도 훼손 | 키 분리보관, 짧은 rotation, 즉시 revoke/재서명 절차 |
| LLM 환각/오판 | 오탐 설명/운영 혼선 | LLM 비결정권 원칙, 스키마 검증, human review |
| 세무 분류 오류 | 추징/벌금 리스크 | MoR 우선 도입 + 분기별 세무 리뷰 |
| 결제 실패율 상승 | MRR 손실 | dunning, 결제수단 업데이트 UX, 실패사유 분석 |
| 환율 변동 | 마진 악화 | USD/KRW 이중가격표, 분기별 가격 리밸런싱 |

## 7) Final Recommendation

1. **클라우드/아키텍처**: AWS 서울 단일리전(Multi-AZ)로 MVP를 빠르게 출시하고, 증빙은 S3 Object Lock으로 불변 저장을 즉시 적용한다.  
2. **API/검증 경로**: 결정 로직은 deterministic engine에 고정하고, LLM은 “설명/분류/요약” 보조로만 사용한다.  
3. **결제 전략**: 국내는 PG 1개(Toss/KCP/Inicis 중)로 빠르게 개통, 해외는 MoR(Paddle/Lemon Squeezy)로 세무 부담을 최소화한다.  
4. **예산 전략**: 초기 2개월은 Base 시나리오(월 약 **675만 KRW**)를 상한으로 운영하고, 트래픽·전환률 지표 기반으로 단계 승격한다.  
5. **실행 우선순위**: “발급 신뢰성(서명/타임스탬프/투명로그) -> 과금 자동화 -> 글로벌 확장” 순으로 진행한다.

## Reference Links (for implementation check)

- Toss Payments API/Authorization/Billing:  
  - https://docs.tosspayments.com/reference  
  - https://docs.tosspayments.com/reference/using-api/authorization  
  - https://docs.tosspayments.com/guides/v2/billing/integration-api
- NHN KCP Developer Center:  
  - https://developer.kcp.co.kr/page/api
- Stripe global availability (country support check):  
  - https://stripe.com/global
- Paddle MoR / Tax handling:  
  - https://www.paddle.com/help/sell/tax/how-paddle-handles-vat-on-your-behalf
- Lemon Squeezy MoR / Tax handling:  
  - https://docs.lemonsqueezy.com/help/payments/merchant-of-record  
  - https://docs.lemonsqueezy.com/help/payments/sales-tax-vat
- PayPal Subscriptions API:  
  - https://developer.paypal.com/docs/subscriptions/

# Payment Provider Scorecard

R-PAY-1100

작성일: 2026-03-24

대상: 한국 운영자 기준 결제 공급자 비교

## 전제와 가정

- 한국 법인/개인사업자가 운영하는 B2C SaaS 또는 디지털 구독 서비스를 기준으로 정리했다.
- 1차 목표는 `KRW` 정기결제와 국내 결제 전환율, 2차 목표는 해외 매출 확대와 세무 운영 단순화다.
- 국내 PG의 수수료와 정산 조건은 가맹점 계약에 따라 달라질 수 있어, 공개 문서만으로는 최종 계약 조건을 확정할 수 없다.
- 아래 점수는 `공개 문서 기반의 방향성 평가`이며, 협상가맹점 견적이 아니다.
- 세무/VAT 항목은 운영 체크리스트이며 법률 자문은 아니다.

## 점수 기준과 가중치

가중치는 한국 운영자에게 흔한 우선순위를 반영했다.

| 기준 | 가중치 | 해석 |
| --- | ---: | --- |
| KRW 정기결제 | 30 | 국내 카드/계좌 기반 구독 결제의 완성도 |
| 해외세무처리 | 20 | MoR 여부, VAT/세금 운영 부담, 해외 판매 적합성 |
| 수수료 | 15 | 공개 수수료 수준과 구조의 예측 가능성 |
| 정산주기 | 10 | 현금흐름과 운영 안정성 |
| 개발난이도 | 15 | SDK/API/도입 속도, 유지보수 부담 |
| 차지백 대응 | 10 | 분쟁 처리, 리스크 완화, 증빙/방어 체계 |

점수는 `1~5점`이다.

- `5`: 매우 강함
- `4`: 강함
- `3`: 무난함
- `2`: 약함
- `1`: 적합하지 않음

가중 총점은 `점수 x 가중치`의 합으로 계산했다.

## 후보 점수표

| 후보 | Lane | KRW 정기결제 | 해외세무처리 | 수수료 | 정산주기 | 개발난이도 | 차지백 대응 | 가중 총점 / 500 | 요약 판단 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 토스페이먼츠 | 국내 PG | 5 | 1 | 4 | 4 | 3 | 3 | 345 | 국내 구독 결제와 정산 속도는 강점, 해외 세무는 직접 처리해야 함 |
| KG이니시스 | 국내 PG | 4 | 1 | 3 | 4 | 2 | 3 | 285 | 정기결제와 정산 옵션은 안정적이지만 연동/운영 복잡도는 상대적으로 큼 |
| NHN KCP | 국내 PG | 4 | 1 | 3 | 4 | 3 | 4 | 310 | 정기결제와 부가서비스가 넓고, 리스크/에스크로 도구가 비교적 풍부함 |
| Paddle | 글로벌 MoR | 2 | 5 | 3 | 2 | 4 | 4 | 325 | 해외세무와 MoR 역할이 강점, 다만 KRW 국내 결제에는 비주력 |
| Lemon Squeezy | 글로벌 MoR | 2 | 5 | 2 | 2 | 5 | 4 | 325 | 구현은 매우 쉽지만, 비용 구조와 정산 유연성은 Paddle보다 약함 |
| PayPal | 대안 | 1 | 1 | 2 | 2 | 4 | 2 | 180 | 진입은 쉽지만 MoR이 아니고 분쟁/환전 부담이 커서 단독 축으로는 약함 |

### 해석

- 국내 결제만 보면 `토스페이먼츠`가 가장 먼저 검토할 후보다.
- 해외 판매와 세금 운영까지 포함하면 `Paddle`이 가장 강하다.
- `Lemon Squeezy`는 구현 난이도는 낮지만, 정산/비용 제어는 Paddle보다 덜 유연하다.
- `PayPal`은 보조 결제수단으로는 유용하지만, 한국 운영자의 주 결제 인프라로 쓰기에는 세무/정산/분쟁 관점에서 약하다.
- 총점은 같은 가중치로 비교한 방향성 지표이며, `PG`와 `MoR`는 해결하는 문제가 달라 lane fit을 함께 봐야 한다.

## 2단계 권고안

### 단계 1: 출시 ~ 3개월

권고: `토스페이먼츠`를 1차 PG로 붙이고, `KRW 카드 정기결제`를 먼저 안정화한다.

이유:

- 국내 사용자 입장에서 익숙한 결제 경험을 만들기 쉽다.
- 공개 문서상 카드/계좌 자동결제를 지원하고, 정기구독형 서비스에 맞게 설계돼 있다.
- 평균 정산이 `5일 이내`로 안내돼 현금흐름 관리가 비교적 쉽다.

운영 포인트:

- 정기결제 승인 흐름, 해지, 재시도, 실패 알림을 먼저 완성한다.
- 해외 판매는 초기에는 최소화하고, 필요하면 `PayPal`을 임시 보조 채널로만 둔다.
- 이 시점에는 글로벌 MoR 도입보다 `국내 결제 전환율 + 운영 안정성`을 우선한다.

### 단계 2: 스케일

권고: 해외 매출이 실제로 발생하기 시작하면 `Paddle`을 추가해 글로벌 MoR로 분리 운영한다.

이유:

- Paddle은 결제, 구독, 세금/VAT, 환불/분쟁을 한 번에 묶는 구조라 해외 운영 부담을 낮춘다.
- 해외 고객 대상 가격과 세무를 한 채널로 정리할 수 있어 회계/운영 분리도가 높다.
- 국내 `KRW` 결제는 토스페이먼츠에 두고, 해외 B2C는 Paddle로 넘기는 이중 구조가 가장 현실적이다.

스케일 기준:

- 해외 매출 비중이 의미 있게 커질 때
- 해외 VAT/세금 문의가 반복될 때
- 카드 차지백과 환불 운영이 팀 부담이 될 때
- 국가별 결제수단/통화가 필요할 때

## 계약 / 정산 / 세금 / VAT 운영 체크리스트

### 계약

- 가맹점 계약서에서 `PG`와 `MoR`의 역할을 분리해 확인한다.
- 환불 책임, 차지백 책임, 분쟁 대응 주체를 문서로 남긴다.
- 정기결제는 `추가 계약` 또는 `리스크 심사`가 필요한지 확인한다.
- 정산 보류, 잔액 보유, reserve, rolling hold 조건이 있는지 확인한다.
- MID별 수수료와 통화, 결제수단 범위를 확정한다.

### 정산

- 정산주기 `D+N`, 주정산/월정산, 휴일 처리 규칙을 확인한다.
- 정산통화, 환전 방식, 출금 수수료, 은행 수취 수수료를 확인한다.
- 정산 지연 사유와 에러 발생 시 연락 창구를 정해둔다.
- PG 수수료 세금계산서 발행 시점과 수령 이메일을 지정한다.
- 해외 MoR 사용 시, 실제 입금액이 `총매출 - 세금 - 수수료 - 환전비용` 기준인지 확인한다.

### 세금

- 국내 판매 매출은 사업자 부가가치세 신고 범위에 맞게 분리 집계한다.
- `국세청` 기준 일반과세자는 반기 단위 신고/납부, 간이과세자는 연 1회 신고 원칙을 확인한다.
- PG 수수료에 대한 세금계산서 수취 여부를 점검한다.
- 해외 MoR을 쓰는 경우, `고객에게 세금을 누가 부과하고 누구 명의로 신고하는지`를 계약서에 명확히 둔다.
- 해외 법인/해외 이용자 대상 전자적 용역은 별도의 VAT 규칙이 적용될 수 있으므로, 국가별 처리방식을 검토한다.

### VAT 운영

- 한국 내 판매가 포함되면 부가가치세 10% 처리 기준을 먼저 확정한다.
- MoR가 VAT를 대행하더라도, 국내 법인의 회계상 매출/수수료 인식 방식은 별도 검토가 필요하다.
- 해외 판매 시 가격표에 `세전/세후` 표기를 통일한다.
- 인보이스, reverse invoice, 세금계산서, 영수증 저장 기간을 정의한다.
- 환불 시 세액 조정 기준을 월말 마감 전에 자동 반영한다.

### 차지백 / 분쟁 대응

- 결제명세서의 descriptor를 사용자가 알아볼 수 있게 맞춘다.
- 결제 실패, 환불, 취소, 구독 종료 이메일 템플릿을 준비한다.
- 분쟁 증빙에 필요한 주문 로그, IP, 사용 이력, 동의 기록을 보관한다.
- 지원팀이 처리할 SLA를 정하고, MoR 또는 PG의 분쟁 접수 창구를 분리한다.

## 최종 추천 조합

`토스페이먼츠 + Paddle`

왜 이 조합인가:

- `토스페이먼츠`는 한국 운영자의 `KRW 정기결제`와 국내 정산에 가장 현실적이다.
- `Paddle`은 해외 고객의 세금/VAT/차지백 운영을 MoR 형태로 흡수해 준다.
- 두 서비스를 분리하면 국내와 해외의 가격, 세금, 분쟁 대응을 깔끔하게 나눌 수 있다.

## 보류안

`Lemon Squeezy`

보류 이유:

- MoR로서 장점은 분명하지만, Paddle보다 정산과 비용 구조를 더 보수적으로 봐야 한다.
- 구현은 쉽지만, 스케일 단계에서 요구되는 운영 제어력은 Paddle 쪽이 더 낫다.
- 다만 `빠른 런칭`만 최우선이면, Lemon Squeezy는 임시 대안으로 검토할 수 있다.

## 참고한 공식 자료

- Toss Payments 요금/정산: https://www.tosspayments.com/about/fee
- Toss Payments 자동결제(빌링): https://docs.tosspayments.com/guides/v2/billing
- Toss Payments 정산 개요: https://docs.tosspayments.com/en/overview
- Toss Payments 결제위젯: https://docs.tosspayments.com/guides/v2/payment-widget
- KG이니시스 정기결제: https://www.inicis.com/sv-regular
- KG이니시스 정산안내: https://www.inicis.com/pg-calc
- NHN KCP 서비스: https://kcp.co.kr/
- NHN KCP 자동결제: https://developer.kcp.co.kr/page/document/autopay
- Paddle pricing: https://www.paddle.com/pricing
- Paddle chargebacks: https://www.paddle.com/help/manage/risk-prevention/understanding-chargebacks-with-paddle
- Paddle payout schedule: https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid
- Lemon Squeezy fees: https://docs.lemonsqueezy.com/help/getting-started/fees
- Lemon Squeezy getting paid: https://docs.lemonsqueezy.com/help/getting-started/getting-paid
- Lemon Squeezy subscriptions: https://docs.lemonsqueezy.com/help/products/subscriptions
- PayPal merchant fees: https://www.paypal.com/kr/business/paypal-business-fees?locale.x=en_KR
- PayPal subscriptions docs: https://developer.paypal.com/docs/subscriptions/customize/pricing-plans/
- NTS VAT overview: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2225
- NTS VAT on electronic services: https://www.nts.go.kr/english/na/ntt/selectNttList.do?bbsId=30699&mi=11210

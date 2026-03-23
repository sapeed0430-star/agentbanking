# Detailed Development Plan: Product, Architecture, Integrity, Receipt

## 0) 문서 목적
이 문서는 아래 4개 범위를 구현 가능한 수준으로 세분화한다.
1. 제품 정의(MVP)
2. 핵심 기술 아키텍처
3. 위변조 불가 설계
4. Receipt 스키마 초안 고도화

## 1) 제품 정의(MVP 범위 상세)

## 1.1 입력/출력 계약
1. 입력: `VerificationRequest`
2. 출력A: `AuditReport` (상세 감사 원문 JSON)
3. 출력B: `Receipt` (요약/검증 정보 JSON)
4. 출력C: `Certificate` (대외 제출용, VC 옵션 지원)

## 1.2 MVP API 경계
1. `POST /verify`
- 기능: 검증 요청 접수, 규칙 검증, Receipt/Report 생성
- 성공: `201` + `VerifyResponse(receipt, audit_report)`
- 실패: `ErrorResponse` 또는 `IntegrityFailureResponse`
2. `GET /receipts/{receiptId}`
- 기능: 발급된 Receipt 조회
3. `POST /verify/offline`
- 기능: 오프라인 검증 입력(Receipt + 증명 데이터) 검증
4. `GET /.well-known/jwks.json`
- 기능: 공개키 배포

## 1.3 오프라인 검증 도구 범위
1. CLI: `verify-receipt --receipt <file> --report <file>`
2. SDK: Node.js 우선 제공
3. 검증 결과: `PASS/FAIL`, 실패 코드, 실패 필드, `correlation_id`

## 1.4 MVP 완료 기준
1. 요청 1건 -> Report/Receipt 생성 성공
2. Receipt 온라인 검증 성공
3. Receipt 오프라인 검증 성공
4. tamper test(1 byte 변경) 즉시 실패 검출

## 2) 핵심 기술 아키텍처 상세

## 2.1 서비스 구성
1. Ingestion API
- OIDC access token 검증
- mTLS client cert 검증
- nonce/idempotency/replay 방지
2. Policy & Verifier Engine
- 정책 버전 로딩
- 규칙 평가
- 판정 결과 + 상세 finding 생성
3. Evidence Store
- 원문과 해시 분리 저장
- URI, digest, retention 메타 저장
4. Signer Service
- RFC8785(JCS) canonicalization
- JWS Ed25519 서명
5. Timestamp Service
- RFC3161 토큰 획득/검증
6. Transparency Log Service
- Merkle inclusion/consistency proof 저장
7. Receipt Issuer
- Receipt/Certificate 최종 발급
8. Key Management
- KMS/HSM 키 생성, 회전, 폐기
- JWKS 공개키 배포

## 2.2 데이터 흐름(요약)
1. `POST /verify` 수신
2. 인증/인가/재전송 방지 통과
3. 검증 엔진 실행
4. Evidence 해시 기록
5. AuditReport 생성 후 `report_digest` 계산
6. 서명 + 타임스탬프 + 투명로그 증명 결합
7. Receipt/Certificate 발급
8. 검증 API/CLI로 재검증 가능 상태 제공

## 2.3 아키텍처 운영 요구
1. 멱등성 키(`request_id` + nonce) 강제
2. 각 단계 `correlation_id` 공통 전파
3. 장애 시 안전 실패(fail-closed) 기본
4. 감사 추적을 위해 불변 이벤트 로그 유지

## 3) 위변조 불가 설계 상세

## 3.1 권장 증명 체인
1. JCS canonical JSON 생성
2. SHA-256 digest 계산
3. JWS Ed25519 서명
4. RFC3161 timestamp token 결합
5. Transparency inclusion/consistency proof 결합
6. 일 단위 root hash WORM 앵커링

## 3.2 검증 알고리즘(필수 순서)
1. 스키마 검증
2. canonicalization 재생성
3. digest 재계산 비교
4. JWS 서명 검증(`alg=none` 즉시 거부)
5. timestamp token 검증
6. transparency proof 검증
7. retention/정책 버전 유효성 검증

## 3.3 실패 분류(표준 코드)
1. `SIGNATURE_VERIFICATION_FAILED`
2. `DIGEST_MISMATCH`
3. `TIMESTAMP_PROOF_INVALID`
4. `TRANSPARENCY_PROOF_INVALID`
5. `REQUEST_REPLAY_DETECTED`

## 3.4 보안 제어
1. 키 회전 주기: 90일(기본)
2. 키 유출 모의훈련: 30분 내 폐기 + 신규키 전환
3. 고위험 실패(critical) 즉시 Sev-0 에스컬레이션

## 4) Receipt 스키마 고도화 계획

## 4.1 필수 필드(확정)
1. 식별자: `receipt_id`, `report_id`, `request_id`, `schema_version`
2. 주체정보: `agent_id`, `operator_id`, `policy_version`
3. 판정: `verification_result`
4. 무결성: `report_digest`, `signature`
5. 시간증명: `timestamp_proof`
6. 투명로그: `transparency_proof`
7. 증빙참조: `evidence_refs`
8. 운영메타: `issued_at`, `retention_until`, `verification_endpoint`

## 4.2 스키마 개선 작업
1. `retention_until` 필드 추가
2. `verification_endpoint` 필드 추가
3. `signature.alg`를 `EdDSA` 기본 정책으로 고정(확장 허용 시 버전 관리)
4. `additionalProperties: false` 유지
5. `format`(uuid/date-time/uri) 강제

## 4.3 스키마 버전 정책
1. Minor 변경: optional 필드 추가
2. Major 변경: required 필드/의미 변경
3. 버전 전환 시 최소 1개 버전 동시 검증 지원

## 5) 의사결정 체크포인트
1. Rekor vs Trillian 선택 확정
2. TSA 공급자 1차/2차 이중화 정책 확정
3. Certificate VC 포맷 채택 여부 확정
4. 오프라인 SDK 언어 범위(Node 우선, Python 후속) 확정

## 6) 일일 보고 연계
1. 일일 보고서에는 4개 영역별 진행률을 모두 기재한다.
2. 팀장 검증 시 4개 영역 각각 PASS/PARTIAL/BLOCK를 병행 판단한다.
3. 근거 문서 링크가 없으면 해당 영역은 자동 BLOCK 처리한다.


# Backend Proof Suite Runbook - 2026-03-25

## 목적
`live proof PASS` 경로와 `runtime proof PASS` 경로를 한 번에 실행하는 표준 명령을 제공한다.

## 표준 명령
```bash
make proof-suite
```

내부 실행:
- `bash scripts/run-proof-suite.sh`
- live proof: `node scripts/capture-live-proof-evidence.js --output <path>`
- runtime proof: `bash scripts/capture-runtime-proof.sh`

## 필수/권고 환경 변수
필수:
- `AUDIT_ADMIN_TOKEN` (24자 이상)
- `AUDIT_SIGNER_PRIVATE_KEY_PATH` (읽기 가능한 signer private key 경로)
- `AUDIT_RFC3161_ENDPOINT`
- `AUDIT_REKOR_BASE_URL`
- `PROOF_SUITE_REKOR_KEY_SOURCE`
  - `signer-public-key-path` 또는 `env`

`PROOF_SUITE_REKOR_KEY_SOURCE=signer-public-key-path`일 때 추가 필수:
- `AUDIT_SIGNER_PUBLIC_KEY_PATH`

`PROOF_SUITE_REKOR_KEY_SOURCE=env`일 때 추가 필수:
- `AUDIT_REKOR_PUBLIC_KEY_PEM_B64`

권고:
- `RUNTIME_PROOF_AUTH_TOKEN` 값을 `AUDIT_ADMIN_TOKEN`과 동일하게 설정

## 검증 규칙
`run-proof-suite.sh`는 실행 전에 다음을 검증한다.
1. `AUDIT_ADMIN_TOKEN` 길이(24자 이상)
2. signer key path 유효성(`AUDIT_SIGNER_PRIVATE_KEY_PATH`, 필요 시 `AUDIT_SIGNER_PUBLIC_KEY_PATH`)
3. rekor key source 유효성(`PROOF_SUITE_REKOR_KEY_SOURCE` 값과 입력 소스)

검증 실패 시 proof 실행 없이 즉시 종료한다.

## live proof 키 처리 방식
live proof 실행 시 항상 `AUDIT_REKOR_PUBLIC_KEY_PEM_B64`를 사용한다.
- source가 `signer-public-key-path`이면 `AUDIT_SIGNER_PUBLIC_KEY_PATH` 파일을 base64로 변환하여 주입한다.
- source가 `env`이면 기존 `AUDIT_REKOR_PUBLIC_KEY_PEM_B64` 값을 사용한다.

## 실행 요약 출력
스크립트는 종료 전에 요약을 출력한다.
- Overall(PASS/FAIL)
- Live proof 결과/산출물 경로
- Runtime proof 결과/리포트 경로
- 경고 목록(예: runtime 토큰 일치 권고)
- 검증 오류 목록

예시:
```text
=== Proof Suite Summary ===
Overall: PASS
Live proof: PASS (result=PASS, output=/Users/myungchoi/Documents/New project/docs/week2/backend/evidence/live-proof-2026-03-25T13-00-00Z.json)
Runtime proof: PASS (result=PASS, report=/Users/myungchoi/Documents/New project/docs/week2/backend/runtime-proof-2026-03-24.md)
```

## 실행 예시
기본:
```bash
make proof-suite
```

직접 실행:
```bash
bash scripts/run-proof-suite.sh
```

rekor key를 env에서 직접 공급:
```bash
PROOF_SUITE_REKOR_KEY_SOURCE=env \
AUDIT_REKOR_PUBLIC_KEY_PEM_B64="$(base64 < .keys/live-proof-ed25519-public.pem | tr -d '\n')" \
make proof-suite
```

## CI 연동 (GitHub Actions)
- Workflow 파일: `.github/workflows/proof-suite-ci.yml`
- 기본 구조:
  1. `unit-tests` (항상 실행)
  2. `proof-suite` (수동 실행 또는 `ENABLE_PROOF_SUITE=true`일 때 실행)
- `proof-suite` job 동작:
  - CI용 signer keypair 생성
  - `scripts/run-proof-suite.sh` 실행
  - 실패 여부와 관계없이 증적 업로드

### CI에서 주입 가능한 값
- `secrets.AUDIT_ADMIN_TOKEN`
- `secrets.RUNTIME_PROOF_AUTH_TOKEN`
- `vars.AUDIT_RFC3161_ENDPOINT`
- `vars.AUDIT_REKOR_BASE_URL`

값이 비어 있으면 workflow 내부 기본값을 사용한다.

### 업로드 산출물
- `proof-suite.log`
- `ci-keygen.json`
- `docs/week2/backend/evidence/live-proof-*.json`
- `docs/week2/backend/runtime-proof-2026-03-24.md`

# Origin Branch Verification Checklist (Week 1)

## 목적
remote(origin) 연결과 로컬 브랜치 정합성(푸시 대상)을 팀장 관점에서 매일 10분 내 점검한다.

## A. 사전 조건
1. 작업 경로가 저장소 루트인지 확인
   - `cd '/Users/myungchoi/Documents/New project'`
2. 인증 상태 확인
   - `git remote -v`에서 `origin https://github.com/sapeed0430-star/agentbanking.git` 출력
3. 푸시 전 `.gitignore` 확인
   - `.DS_Store`가 `.gitignore`에 포함되어 있어야 함

## B. 로컬 브랜치 점검
1. 로컬 브랜치 존재
   - `git branch -vv`
   - 최소 `main`, `staging`, `develop`, `release/0.1.0`, `hotfix/initial-fix` 확인
2. 작업 브랜치 정리
   - 현재 브랜치가 `main` 또는 해당 작업 브랜치인지 확인
   - 비정상 변경 파일이 있으면 `git status`로 확인
3. 푸시 대상 확정
   - 팀장 기준 푸시 타깃: `main`, `develop`, `staging`, 모든 로컬 `release/*`, `hotfix/*`

## C. 푸시 실행
1. 일괄 푸시
   - `make push-all`
2. 인증 실패 시
   - `git config --global credential.helper osxkeychain`
   - 다시 `make push-all`
   - Username: `sapeed0430-star`, Password: PAT

## D. 푸시 결과 검증
1. 원격 브랜치 반영 확인
   - `git branch -r`
2. 로컬 추적 정보 확인
   - `git branch -vv`
   - `origin/main`, `origin/develop`, `origin/staging` 등 추적 표시가 있는지 확인
3. 브랜치 보존 규칙
   - 긴급 브랜치(`hotfix/*`)는 해결 후 7일 내 정리, release는 릴리스 종료 후 즉시 정리

## E. 기록 포맷 (매일 운영 노트)
- 점검 시간:
- 실행자:
- `make push-all` 결과:
- 원격 반영 브랜치:
- 블로커(있으면):
- 다음 액션:

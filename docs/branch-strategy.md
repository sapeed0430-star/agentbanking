# Branch Strategy & Protection Rules

## 1) Branch Model

- main
  - Purpose: Production-ready source only.
  - Deployment target: production environment.
  - Merge source: only release/* and hotfix/* via Pull Request.

- staging
  - Purpose: Pre-production integration and release validation.
  - Merge source: only develop and release/* via Pull Request.

- develop
  - Purpose: Daily development integration branch.
  - Merge source: feature/* and back-merged hotfix/*.

- feature/*
  - Purpose: Isolated agent feature work.
  - Example: feature/agent-audit-flow

- release/*
  - Purpose: Release preparation, smoke-test scope, final QA before prod.
  - Example: release/1.4.0

- hotfix/*
  - Purpose: Emergency fixes for production incidents.
  - Example: hotfix/timestamp-verification-bug

## 2) Workflow

1. Create a feature/* branch from develop.
2. Merge completed feature via PR into develop after passing required checks.
3. Merge develop into staging for integration and acceptance.
4. Open release/* from staging for final release preparation.
5. After QA approval, merge release/* into main.
6. Tag production release as vX.Y.Z.
7. Merge release/* back into develop.
8. For emergency issues, open hotfix/* from main and back-merge into develop after merge.

## 3) Branch Protection Rules (GitHub)

### 3.1 main

- Require pull requests for all merges.
- Require at least 1 reviewer approval.
- Require status checks to pass before merge.
- Required checks (minimum): ci/test, ci/lint, ci/build, security/secrets-scan.
- Require branches to be up to date before merging.
- Dismiss stale approvals when new commits are pushed.
- Require linear history.
- Require signed commits if possible.
- Restrict force pushes.
- Restrict who can push: release lead only (optional).

### 3.2 staging

- Require pull requests for merge.
- Require status checks.
- Restrict force pushes.
- Optional: allow 1 approving reviewer.

### 3.3 develop

- Require pull requests for merge from feature branches.
- Require status checks at least ci/test and ci/lint.
- Restrict force pushes.

### 3.4 release/*

- Require PR for merge.
- Require status checks ci/test and ci/build.
- Restrict force pushes.

### 3.5 hotfix/*

- Create from main and keep scope tight.
- Require checks before merging back to main.
- Restrict force pushes.

## 4) Local branch bootstrap commands

git checkout main

git checkout -b develop
git checkout main
git checkout -b staging

git checkout main
git checkout -b release/0.1.0

git checkout -b hotfix/initial-fix

## 5) Naming Conventions

- Use kebab-case branch names.
- Example: feature/audit-schema-refactor
- Avoid dots in branch names.
- Prefer versioned release tags: release/1.4.0
- Include ticket IDs when possible: feature/AUD-1234-agent-notice

## 6) Governance

- Weekly branch health review by team lead.
- Remove old release/* or hotfix/* branches after 14 days unless actively maintained.
- main merge must include release notes and changelog entry.

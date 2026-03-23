# Release & Hotfix Workflow (Makefile)

This repository now includes an automation Makefile for branch operations.

## Branch baseline
- main: production branch
- staging: pre-production branch
- develop: integration branch
- feature/*: task branches
- release/*: release candidate branches
- hotfix/*: emergency branches

## Usage

- `make branch-dev`
  - Recreate `develop` from latest `main` and switch to it.
- `make branch-stage`
  - Recreate `staging` from latest `main` and switch to it.
- `make branch-sync`
  - Sync local `develop`, `staging`, `main` to origin heads.

## Release flow

- `make release-start VERSION=1.4.0`
  - Creates or checks out `release/1.4.0` from `staging`.
- `make release-finish VERSION=1.4.0`
  - Checks out `release/1.4.0`, asks for QA confirmation, merges it to `main`, tags `v1.4.0`, then merges back into `develop`.
- `make release-announce VERSION=1.4.0`
  - Emits reminder commands for changelog publication.

## Hotfix flow

- `make hotfix-start ISSUE=some-bug`
  - Checks out `main`, creates `hotfix/some-bug`.
- `make hotfix-finish ISSUE=some-bug`
  - Merges `hotfix/some-bug` into `main` then `develop`.

## Push to origin

- `make push-main`
  - Pushes `main`, `develop`, `staging` branches to `origin`.

## Recommended order for standard release

1. `make branch-dev`
2. feature work and PR merge
3. `make branch-stage`
4. release QA on staging
5. `make release-start VERSION=<x.y.z>`
6. finalize tests on release branch
7. `make release-finish VERSION=<x.y.z>`
8. `make push-main`
9. apply branch protection rules in GitHub UI (manual)

## GitHub HTTPS Authentication

- Configure once per machine: `git config --global credential.helper osxkeychain`
- On first push, use:
  - Username: `sapeed0430-star`
  - Password: Personal Access Token (PAT, repo scope required)
- If push fails, retry with: `make push-all`

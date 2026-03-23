SHELL := /bin/bash

.PHONY: help
.PHONY: status branches
.PHONY: branch-dev branch-stage branch-sync
.PHONY: release-start release-finish release-announce
.PHONY: hotfix-start hotfix-finish
.PHONY: push-main

CURRENT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

help:
	@echo "Branch automation targets"
	@echo "make branches            - list local branches and sync status"
	@echo "make branch-dev          - create/update develop from main"
	@echo "make branch-stage        - create/update staging from main"
	@echo "make release-start VERSION=v1.0.0"
	@echo "make release-finish VERSION=v1.0.0"
	@echo "make hotfix-start ISSUE=token"
	@echo "make hotfix-finish ISSUE=token"
	@echo "make push-main           - push main, develop, staging"

status:
	@echo "Current branch: $(CURRENT_BRANCH)"
	@git status --short --branch

branches:
	@git branch --verbose --all

branch-dev:
	@git checkout main
	@git pull --ff-only origin main
	@git branch -f develop main
	@git checkout develop

branch-stage:
	@git checkout main
	@git pull --ff-only origin main
	@git branch -f staging main
	@git checkout staging

branch-sync:
	@git fetch origin
	@git checkout develop
	@git merge --ff-only origin/develop
	@git checkout staging
	@git merge --ff-only origin/staging
	@git checkout main
	@git merge --ff-only origin/main
	@echo "Synced develop, staging, and main to remote head"

release-start:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make release-start VERSION=v1.2.3"; \
		exit 1; \
	fi
	@if ! git show-ref --verify --quiet refs/heads/release/$(VERSION); then \
		$(MAKE) branch-stage; \
		git checkout -b release/$(VERSION) staging; \
	else \
		git checkout release/$(VERSION); \
	fi
	@echo "Created/checked out release/$(VERSION)"

release-finish:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make release-finish VERSION=v1.2.3"; \
		exit 1; \
	fi
	@git fetch origin
	@git checkout release/$(VERSION)
	@git merge --ff-only origin/release/$(VERSION) || true
	@read -p "Run final QA/sign-off already completed? (y/N) " -r ans && \
	if [ "$$ans" != "y" ]; then \
		echo "Abort: confirm with y"; \
		exit 1; \
	fi
	@git checkout main
	@git merge --no-ff release/$(VERSION) -m "chore: release $(VERSION)"
	@git tag -a v$(VERSION) -m "Release v$(VERSION)"
	@git checkout develop
	@git merge --no-ff release/$(VERSION)
	@echo "Release complete: release/$(VERSION) merged into main and develop. Tag v$(VERSION) created."

release-announce:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make release-announce VERSION=v1.2.3"; \
		exit 1; \
	fi
	@echo "Prepare release notes for v$(VERSION) and publish draft."
	@echo "Suggested location: CHANGELOG.md and docs/changelog/v$(VERSION).md"

hotfix-start:
	@if [ -z "$(ISSUE)" ]; then \
		echo "Usage: make hotfix-start ISSUE=token"; \
		exit 1; \
	fi
	@git checkout main
	@if ! git show-ref --verify --quiet refs/heads/hotfix/$(ISSUE); then \
		git checkout -b hotfix/$(ISSUE) main; \
	else \
		git checkout hotfix/$(ISSUE); \
	fi

hotfix-finish:
	@if [ -z "$(ISSUE)" ]; then \
		echo "Usage: make hotfix-finish ISSUE=token"; \
		exit 1; \
	fi
	@git checkout hotfix/$(ISSUE)
	@git checkout main
	@git merge --no-ff hotfix/$(ISSUE) -m "fix: apply hotfix $(ISSUE)"
	@git checkout develop
	@git merge --no-ff hotfix/$(ISSUE)
	@echo "Hotfix complete: merged hotfix/$(ISSUE) into main and develop"

push-main:
	@git checkout main
	@git push -u origin main
	@git push -u origin develop
	@git push -u origin staging
	@echo "Push complete for main/develop/staging"

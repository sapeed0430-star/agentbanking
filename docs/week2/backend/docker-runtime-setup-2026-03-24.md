# Docker Runtime Setup Notes - 2026-03-24

## Purpose
Record the exact Docker/runtime diagnostics used for B-RUNTIME-1500 and the concrete blocker when compose-first proof cannot complete.

## Current Result
- `make runtime-proof` now prints staged diagnostics before the proof attempt.
- On this host, the Docker CLI is missing, so the compose-first path cannot start.
- The node fallback is also blocked in this sandbox because the process cannot bind `127.0.0.1:3210`.
- Current verdict: `BLOCK`

## Diagnostics Run

### 1) Runtime proof target

Command:
```bash
make runtime-proof
```

Observed output:
```text
RUNTIME_DIAG docker=DOCKER_MISSING note=(not found)
RUNTIME_DIAG daemon=SKIPPED note=(skipped)
RUNTIME_DIAG compose=SKIPPED note=(skipped)
RUNTIME_DIAG fallback=FALLBACK_ONLY note=node:events:486
      throw er; // Unhandled 'error' event
      ^

Error: listen EPERM: operation not permitted 127.0.0.1:3210
...
runtime proof report written to /Users/myungchoi/Documents/New project/docs/week2/backend/runtime-proof-2026-03-24.md
overall verdict: BLOCK
```

Result:
- The runtime proof target now exposes the diagnostic codes directly.
- `DOCKER_MISSING` is the first blocker.
- The fallback path reaches a local bind failure and cannot complete the proof.

### 2) Docker CLI availability

Command:
```bash
command -v docker || true
docker --version 2>/dev/null || true
```

Observed output:
```text
docker: command not found
```

Result:
- Docker is not installed or not on `PATH`.
- This maps to `DOCKER_MISSING`.

### 3) Local bind probe

Command:
```bash
node -e 'require("http").createServer((req,res)=>res.end("ok")).listen(3210,"127.0.0.1",()=>console.log("up"))'
```

Observed output:
```text
Error: listen EPERM: operation not permitted 127.0.0.1:3210
```

Result:
- Even a minimal localhost server cannot bind in this sandbox.
- This is the concrete blocker for the node fallback and maps to `FALLBACK_ONLY` plus a sandbox-level port restriction.

## Diagnostic Codes and Actions

### `RUNTIME_OK`
- Meaning: the stage passed and the next stage may run.
- Action: continue to the compose-first proof and record the generated evidence.

### `DOCKER_MISSING`
- Meaning: `docker` is not on `PATH`.
- Action: install or relink Docker, then rerun `make runtime-proof`.

### `DAEMON_DOWN`
- Meaning: the Docker CLI exists, but the daemon is not reachable.
- Action: start Colima or Docker Desktop, then rerun `docker info` and `make runtime-proof`.

### `COMPOSE_MISSING`
- Meaning: `docker` works, but `docker compose` is unavailable.
- Action: install the compose plugin or `docker-compose`, then rerun the proof.

### `FALLBACK_ONLY`
- Meaning: compose-first evidence could not be captured, so fallback evidence was used or attempted.
- Action: keep the proof partial until compose-first output is available.

## Captured Result
- Runtime proof report: [runtime-proof-2026-03-24.md](./runtime-proof-2026-03-24.md)
- Verdict: `BLOCK`
- Concrete blocker: Docker missing, plus sandbox port binding denied on `127.0.0.1:3210`

## Notes
- The proof report now captures:
  - staged diagnostic lines
  - compose attempt status
  - fallback status
  - bind probe output
- If this is rerun on a host with Docker available, the expected next step is `RUNTIME_OK` for the Docker CLI/daemon/compose checks and then a compose-first PASS.

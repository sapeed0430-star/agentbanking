# Runtime Proof Report - 2026-03-25

## Scope
- Goal: capture staging runtime proof with compose-first execution and node fallback.
- Workspace: /Users/myungchoi/Documents/New project
- Validation date: 2026-03-25 (KST)
- Start: 2026-03-25 21:36:36 KST
- End: 2026-03-25 21:37:17 KST
- Executor: Backend/Ops Worker B

## Execution Summary
| Path | Command | Result | Notes |
| --- | --- | --- | --- |
- Docker CLI check | `command -v docker` | DOCKER_MISSING | docker: command not found
- Docker daemon check | `docker info` | SKIPPED | (skipped)
- Compose plugin check | `docker compose version` | SKIPPED | (skipped)
- Fallback path | `PORT=3210 node "/var/folders/0d/r92vc0q93hz_mdth4_1fzl4c0000gn/T//runtime-proof.BN8cKS/node-fallback.mjs"` | FALLBACK_ONLY | bind probe ready
- Compose first attempt | `docker compose -f deploy/docker-compose.staging.yml up -d --build` | FAIL | docker CLI not found on PATH
- Node fallback | `PORT=3210 node "/var/folders/0d/r92vc0q93hz_mdth4_1fzl4c0000gn/T//runtime-proof.BN8cKS/node-fallback.mjs"` | FAIL | health=unready, jwks=n/a, verify=n/a, code=FALLBACK_ONLY

## Runtime Diagnostic Codes
- `RUNTIME_OK`: the stage passed and the next stage may run.
- `DOCKER_MISSING`: `docker` is not on `PATH`; daemon and compose checks are skipped.
- `DAEMON_DOWN`: `docker` exists, but the daemon is not reachable.
- `COMPOSE_MISSING`: `docker` works, but `docker compose` is unavailable.
- `FALLBACK_ONLY`: compose-first proof was not used; node fallback produced the runtime evidence.

## Endpoint Checks
{"key_count":0,"first_kid":"","first_kty":"","first_crv":""}



## PASS / FAIL Criteria
- PASS when compose startup succeeds, container health is healthy, `GET /.well-known/jwks.json` returns `200`, and `POST /verify` returns `201`.
- PARTIAL PASS when compose is unavailable or fails but the node fallback reproduces the same endpoint behavior with `200`/`201` codes.
- FAIL when both compose and fallback cannot complete the health/jwks/verify sequence.

## Failure Cause
- Compose attempt: node fallback server did not become ready
- Fallback path: bind probe ready

## Next Actions
1. Re-run this report on a host with Docker Compose available if compose-first evidence is required.
2. Preserve the generated request/response artifacts when attaching the runtime proof bundle.
3. If fallback was used, treat the compose runtime proof as pending rather than complete.
4. If the code is `DOCKER_MISSING`, install or relink Docker first; if `DAEMON_DOWN`, start Colima or Docker Desktop; if `COMPOSE_MISSING`, install the compose plugin and rerun.

## Verdict
- Overall verdict: BLOCK

## Logs
### Runtime Diagnostics
```text
RUNTIME_DIAG docker=DOCKER_MISSING note=(not found)
RUNTIME_DIAG daemon=SKIPPED note=(skipped)
RUNTIME_DIAG compose=SKIPPED note=(skipped)
RUNTIME_DIAG fallback=FALLBACK_ONLY note=bind probe ready
```

### Docker CLI Snapshot
```text
docker: command not found
```

### Docker Daemon Snapshot
```text
(skipped)
```

### Docker Compose Snapshot
```text
(skipped)
```

### Compose Attempt
```text
(no compose output captured)
```

### Node Fallback
```text
(node fallback log empty)
```

### Bind Probe
```text
bind probe ready
```

### JWKS Response Summary
```json
{"key_count":0,"first_kid":"","first_kty":"","first_crv":""}
```

### Verify Response Summary
```json

```

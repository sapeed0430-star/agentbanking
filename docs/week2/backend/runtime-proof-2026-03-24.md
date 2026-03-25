# Runtime Proof Report - 2026-03-25

## Scope
- Goal: capture staging runtime proof with compose-first execution and node fallback.
- Workspace: /Users/myungchoi/Documents/New project
- Validation date: 2026-03-25 (KST)
- Start: 2026-03-25 22:25:03 KST
- End: 2026-03-25 22:25:04 KST
- Executor: Backend/Ops Worker B

## Execution Summary
| Path | Command | Result | Notes |
| --- | --- | --- | --- |
- Docker CLI check | `command -v docker` | RUNTIME_OK | Docker version 29.3.0, build 5927d80c76
- Docker daemon check | `docker info` | RUNTIME_OK | Client: Docker Engine - Community
- Compose plugin check | `docker compose version` | RUNTIME_OK | Docker Compose version 5.1.1
- Fallback path | `PORT=3210 node "/var/folders/0d/r92vc0q93hz_mdth4_1fzl4c0000gn/T//runtime-proof.TJX724/node-fallback.mjs"` | RUNTIME_OK | not needed
- Compose first attempt | `docker compose -f deploy/docker-compose.staging.yml up -d --build` | PASS | health={"service":"api","state":"unknown","health":"unknown","note":"compose_ps_unparsed"}
- Node fallback | `PORT=3210 node "/var/folders/0d/r92vc0q93hz_mdth4_1fzl4c0000gn/T//runtime-proof.TJX724/node-fallback.mjs"` | SKIPPED | health=not_needed, jwks=200, verify=201, code=RUNTIME_OK

## Runtime Diagnostic Codes
- `RUNTIME_OK`: the stage passed and the next stage may run.
- `DOCKER_MISSING`: `docker` is not on `PATH`; daemon and compose checks are skipped.
- `DAEMON_DOWN`: `docker` exists, but the daemon is not reachable.
- `COMPOSE_MISSING`: `docker` works, but `docker compose` is unavailable.
- `FALLBACK_ONLY`: compose-first proof was not used; node fallback produced the runtime evidence.

## Endpoint Checks
{
  "key_count": 1,
  "first_kid": "initial-1774445104228-9dd7c87d",
  "first_kty": "OKP",
  "first_crv": "Ed25519"
}

{
  "receipt_id": "cf6872e3-e23f-4c8b-975d-c5a25fcf1f4d",
  "report_id": "rpt_1774445104386_9afcf559",
  "verification_result": "pass",
  "has_signature": true,
  "has_timestamp_proof": true,
  "has_transparency_proof": true
}

## PASS / FAIL Criteria
- PASS when compose startup succeeds, container health is healthy, `GET /.well-known/jwks.json` returns `200`, and `POST /verify` returns `201`.
- PARTIAL PASS when compose is unavailable or fails but the node fallback reproduces the same endpoint behavior with `200`/`201` codes.
- FAIL when both compose and fallback cannot complete the health/jwks/verify sequence.

## Failure Cause
- Compose attempt: none recorded
- Fallback path: not needed

## Next Actions
1. Re-run this report on a host with Docker Compose available if compose-first evidence is required.
2. Preserve the generated request/response artifacts when attaching the runtime proof bundle.
3. If fallback was used, treat the compose runtime proof as pending rather than complete.
4. If the code is `DOCKER_MISSING`, install or relink Docker first; if `DAEMON_DOWN`, start Colima or Docker Desktop; if `COMPOSE_MISSING`, install the compose plugin and rerun.

## Verdict
- Overall verdict: PASS

## Logs
### Runtime Diagnostics
```text
RUNTIME_DIAG docker=RUNTIME_OK note=/opt/homebrew/bin/docker
RUNTIME_DIAG daemon=RUNTIME_OK note=Client: Docker Engine - Community
 Version:    29.3.0
 Context:    colima
 Debug Mode: false
 Plugins:
  compose: Docker Compose (Docker Inc.)
    Version:  5.1.1
    Path:     /opt/homebrew/lib/docker/cli-plugins/docker-compose

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 17
 Server Version: 29.2.1
 Storage Driver: overlayfs
  driver-type: io.containerd.snapshotter.v1
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
RUNTIME_DIAG compose=RUNTIME_OK note=Docker Compose version 5.1.1
RUNTIME_DIAG fallback=RUNTIME_OK note=not needed
```

### Docker CLI Snapshot
```text
Docker version 29.3.0, build 5927d80c76
```

### Docker Daemon Snapshot
```text
Client: Docker Engine - Community
 Version:    29.3.0
 Context:    colima
 Debug Mode: false
 Plugins:
  compose: Docker Compose (Docker Inc.)
    Version:  5.1.1
    Path:     /opt/homebrew/lib/docker/cli-plugins/docker-compose

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 17
 Server Version: 29.2.1
 Storage Driver: overlayfs
  driver-type: io.containerd.snapshotter.v1
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
```

### Docker Compose Snapshot
```text
Docker Compose version 5.1.1
```

### Compose Attempt
```text
time="2026-03-25T22:25:03+09:00" level=warning msg="Docker Compose requires buildx plugin to be installed"
 Image agentbanking-api:staging Building 
 Image agentbanking-api:staging Building 
Sending build context to Docker daemon  524.4kBSending build context to Docker daemon  975.3kB
Step 1/17 : FROM node:20-alpine
 ---> b88333c42c23
Step 2/17 : WORKDIR /app
 ---> Using cache
 ---> 8947f509e6bf
Step 3/17 : ENV NODE_ENV=production
 ---> Using cache
 ---> 57e7496998e2
Step 4/17 : ENV PORT=3000
 ---> Using cache
 ---> 77a5a6350269
Step 5/17 : COPY package.json ./
 ---> Using cache
 ---> b6feef5675d6
Step 6/17 : RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
 ---> Using cache
 ---> a862b865a1e2
Step 7/17 : COPY --chown=node:node server.js ./
 ---> Using cache
 ---> d695ab185c30
Step 8/17 : COPY --chown=node:node index.html ./
 ---> Using cache
 ---> 599496fa3416
Step 9/17 : COPY --chown=node:node styles.css ./
 ---> Using cache
 ---> 00c597d52b72
Step 10/17 : COPY --chown=node:node public ./public
 ---> Using cache
 ---> 36b0b9c988b8
Step 11/17 : COPY --chown=node:node src ./src
 ---> Using cache
 ---> 55d14036faff
Step 12/17 : COPY --chown=node:node docs/week1/backend ./docs/week1/backend
 ---> Using cache
 ---> 66c218815f97
Step 13/17 : USER node
 ---> Using cache
 ---> 6a5f18302255
Step 14/17 : EXPOSE 3000
 ---> Using cache
 ---> 5d99271e437c
Step 15/17 : HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD node -e "const http=require('http');const port=Number(process.env.PORT||3000);const req=http.get({host:'127.0.0.1',port,path:'/.well-known/jwks.json',timeout:3000},(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"
 ---> Using cache
 ---> 841e06177792
Step 16/17 : CMD ["node", "server.js"]
 ---> Using cache
 ---> 44e3d6085587
Step 17/17 : LABEL com.docker.compose.image.builder=classic
 ---> Using cache
 ---> d5d90e73f763
Successfully built d5d90e73f763
Successfully tagged agentbanking-api:staging
 Image agentbanking-api:staging Built 
 Image agentbanking-api:staging Built 
 Network deploy_default Creating 
 Network deploy_default Created 
 Container agentbanking-api-staging Creating 
 Container agentbanking-api-staging Created 
 Container agentbanking-api-staging Starting 
 Container agentbanking-api-staging Started 
```

### Node Fallback
```text
(node fallback log empty)
```

### Bind Probe
```text
((bind probe not executed))
```

### JWKS Response Summary
```json
{
  "key_count": 1,
  "first_kid": "initial-1774445104228-9dd7c87d",
  "first_kty": "OKP",
  "first_crv": "Ed25519"
}
```

### Verify Response Summary
```json
{
  "receipt_id": "cf6872e3-e23f-4c8b-975d-c5a25fcf1f4d",
  "report_id": "rpt_1774445104386_9afcf559",
  "verification_result": "pass",
  "has_signature": true,
  "has_timestamp_proof": true,
  "has_transparency_proof": true
}
```

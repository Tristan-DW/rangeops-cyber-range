# RangeOps

RangeOps is a cyber range and attack simulation platform that lets teams spin up lab runs, execute structured adversary paths, and measure blue-team outcomes with deterministic scoring and replay timelines.

## Why this project

Most security labs show either attack scripts or telemetry dashboards. RangeOps ties both together in one product flow:

- provision isolated labs
- execute attack playbooks mapped to ATT&CK tactics
- collect event timelines from attacker and detector streams
- score detection quality and response speed
- inspect replay artifacts for post-incident review

## Current MVP capabilities

- **Lab lifecycle:** Create scenario-bound labs with TTL expiration metadata.
- **Attack simulation:** Run seeded YAML playbooks with multi-step attack paths.
- **Detection telemetry:** Generate detector events correlated to specific attack steps.
- **Automated scoring:** Coverage, MTTD, false-positive penalty, and normalized final score.
- **ATT&CK-style overview:** Tactic coverage breakdown from historical run data.
- **Replay timeline:** Time-ordered event stream (system, attacker, detector).

## Architecture

### Monorepo layout

- `apps/api` - Express API for scenarios, labs, runs, overview metrics, and timeline data.
- `apps/web` - Browser dashboard for provisioning labs and reviewing run outcomes.
- `packages/shared` - Shared TypeScript domain models used by API and UI.
- `scenarios` - YAML scenario files with tactics, commands, and expected detection delays.
- `docs/db-schema.sql` - Initial relational schema for persistence migration.
- `infra/docker-compose.yml` - Local infra services (PostgreSQL, Redis, OpenSearch).

### Service flow

1. User provisions a lab in the web dashboard.
2. API links lab to a scenario from `scenarios/*.yaml`.
3. User executes a run.
4. Simulation emits attacker + detector events.
5. API computes score and updates overview metrics.
6. UI renders scorecard, tactic coverage, and replay timeline.

## Tech stack

- TypeScript (strict mode)
- Node.js + Express
- YAML scenario modeling
- Zod runtime validation
- Docker Compose for infra dependencies
- GitHub Actions CI (typecheck gate)

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Start API

```bash
npm run dev:api
```

API: `http://localhost:4000`

### 3) Start web dashboard

```bash
npm run dev -w @rangeops/web
```

Web: `http://localhost:3000`

### 4) Run checks

```bash
npm run typecheck
```

## API reference

- `GET /health` - service health check
- `GET /api/scenarios` - list available attack scenarios
- `GET /api/labs` - list provisioned labs
- `POST /api/labs` - create lab (`workspaceId`, `name`, `scenarioId`, `ttlMinutes`)
- `GET /api/runs` - list all runs
- `POST /api/runs` - execute a run (`labId`)
- `GET /api/runs/:runId` - fetch run + score
- `GET /api/runs/:runId/timeline` - fetch ordered timeline events
- `GET /api/overview` - global metrics and tactic coverage matrix

## Example scenario format

See:

- `scenarios/easy-linux-credential-access.yaml`
- `scenarios/intermediate-lateral-movement.yaml`

Each scenario defines:

- scenario metadata
- ordered attack steps
- ATT&CK tactic labels
- command payload
- expected detection latency
- detection rule identifiers

## Security and safety notes

- This repository currently uses simulated detections and in-memory state.
- Do not execute untrusted payloads outside isolated lab environments.
- Keep credentials out of the repository (`.env` is ignored).
- See `SECURITY.md` for reporting and hardening expectations.

## CI and quality gates

GitHub Actions workflow at `.github/workflows/ci.yml` enforces:

- dependency install
- workspace typecheck

## Roadmap

- Persistent storage layer (Prisma + PostgreSQL)
- Queue-based run executor (BullMQ + Redis)
- Rule editor for detection signatures
- Multi-tenant auth and RBAC
- Artifact retention and export pipeline

## Contributing

Please review `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` before opening PRs.

## License

MIT - see `LICENSE`.

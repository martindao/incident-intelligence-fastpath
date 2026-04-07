# Incident Intelligence Fast-Path Console

## Overview

This repo demonstrates how to reduce time-to-diagnosis during production incidents by correlating noisy telemetry into one support-friendly incident record with evidence-backed timeline, probable origin analysis, and linked runbook.

It simulates a startup SaaS environment where alert storms, scattered logs, and slow manual triage waste expensive engineering time — then proves a structured approach to incident intelligence that accelerates support response.

## The Startup Pain This Solves

When a production incident hits, support engineers face:
- **50+ alerts** for what is actually one underlying failure
- **Scattered logs** across API, worker, queue, and database
- **No clear origin** — was it the DB? The worker? An external dependency?
- **Weak incident summaries** that don't help engineers diagnose faster
- **Evidence loss** — transient failures disappear before anyone captures state

This repo proves that structured incident correlation, evidence snapshotting, and support-focused artifact generation materially reduce MTTD (Mean Time to Detection) and MTTR (Mean Time to Resolution).

## What This Repo Demonstrates

- **Event-to-incident promotion**: Raw telemetry is separated from human-actionable incidents
- **Dwell-time correlation**: Alert storms are grouped into one coherent incident instead of 50 noisy tickets
- **Probable origin analysis**: The earliest repeated failure is identified with confidence scoring
- **Immutable evidence snapshots**: Queue depth, DB state, and recent logs are frozen at promotion time
- **Support-friendly artifacts**: Timeline, summary, and evidence bundle are generated automatically
- **Runbook linkage**: Each incident type links to a specific recovery checklist
- **Deterministic scenarios**: Three realistic incident types can be triggered on demand for demo and testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    App-Under-Test                           │
│  API Server → Queue → Worker → Database                     │
│  (generates realistic telemetry and failure modes)          │
└──────────────────────┬──────────────────────────────────────┘
                       │ events (logs via runtime store)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Intelligence Core                         │
│  Ingests events → Correlation Bucket → Promotion            │
│  (groups noisy events, promotes one incident, snapshots)    │
└──────────────────────┬──────────────────────────────────────┘
                       │ artifacts
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Support Console                           │
│  Incident List → Timeline → Evidence → Summary → Runbook    │
│  (support-facing output for faster diagnosis)               │
└─────────────────────────────────────────────────────────────┘
```

All services communicate through a shared file-backed runtime store (`runtime/`), enabling real cross-process event ingestion, queue management, and component health tracking.

## Incident Scenarios

### 1. Poison-Pill Job Payload
A malformed job enters the queue. The worker fails repeatedly on the same payload. Queue grows while API remains superficially healthy. The intelligence core detects repeated same-correlation failures and promotes one incident with the worker as probable origin.

**Run**: `npm run scenario:poison-pill`

### 2. Queue Backlog / Worker Slowdown
Worker processing slows down. Queue depth increases. Downstream job completion delays grow. The intelligence core detects queue depth threshold breach and promotes an incident showing worker + queue degradation.

**Run**: `npm run scenario:queue-backlog`

### 3. Database Connection Exhaustion
DB connection pool fills up. Worker and API experience intermittent write failures. State goes stale. The intelligence core identifies DB as the shared failure origin across multiple services.

**Run**: `npm run scenario:db-exhaustion`

## Artifact Outputs

Each promoted incident generates four artifacts in `artifacts/incidents/<id>/`:

| Artifact | Purpose |
|---|---|
| `incident.json` | Structured incident record with origin, severity, affected components |
| `timeline.json` | Chronological event sequence from first anomaly to promotion |
| `evidence-bundle.json` | Immutable snapshot of queue depth, DB state, recent logs at promotion time |
| `summary.md` | Support-friendly incident summary with recommended next actions |

## How to Run Locally

### Prerequisites
- Node.js 18+

### Quick Start
```bash
# Install dependencies
npm install

# Reset any previous runtime state
npm run reset

# Start all services (uses concurrently for reliable multi-process startup)
npm run start:all

# In a new terminal, run a scenario:
npm run scenario:poison-pill
npm run scenario:queue-backlog
npm run scenario:db-exhaustion

# View the support console:
open http://localhost:3003
```

### What to Watch For
1. The API accepts jobs normally on port 3001
2. The worker processes (or fails) jobs based on scenario mode
3. The intelligence core ingests events from the shared runtime store, correlates them, and promotes incidents
4. Artifacts appear in `artifacts/incidents/<id>/`
5. The support console on port 3003 shows the incident list, component health, and links to artifacts/runbooks

### Reset Between Demos
```bash
npm run reset
```

## How to Test

```bash
# Unit tests (correlation, promotion, evidence, timeline, summary, runtime store)
npm test

# Integration tests (full-system scenario validation)
npm run test:integration
```

The test suite validates:
- Correlation logic groups related events correctly
- Promotion rules trigger at correct thresholds
- Evidence snapshots capture bounded state from the shared runtime store
- Timeline generation produces chronological entries
- Summary generation includes all required sections
- Runtime store persists queue, health, scenario mode, and events across calls

## Why This Matters to Application Support

This repo proves that application support is not just ticket handling — it is **operational acceleration**. By structuring noisy evidence into one actionable incident object, support engineers can:

- Diagnose faster instead of wading through 50 individual alerts
- Preserve evidence before transient failures disappear
- Hand engineers a cleaner, faster path to root cause
- Reduce the manual toil that burns out support teams

The patterns demonstrated here — event-to-incident separation, dwell-time correlation, evidence snapshotting, and support-focused artifact generation — are directly applicable to any startup dealing with production incidents.

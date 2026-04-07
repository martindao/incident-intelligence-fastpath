# Incident: Database connection exhaustion affecting database, api

| Field | Value |
|---|---|
| **ID** | inc_047 |
| **Severity** | P2 |
| **Status** | open |
| **Opened** | 2026-04-06T10:24:04.190Z |
| **Primary Service** | database |
| **Affected Components** | database, api |

## What Happened

The intelligence core detected 4 correlated events
across 2 service(s) within the correlation window.
The probable origin is **database**
(80% confidence): earliest repeated failure in correlation window (3 events)

## Evidence Captured

- Queue depth at capture: 0
- Failed jobs: 0
- Processed jobs: 0
- DB connections: 85/100
- Component health: api=operational, job-worker=operational, queue=operational, database=degraded

## Timeline Highlights

- `2026-04-06T10:24:03.982Z` [ERROR] database: First anomaly detected: Too many database connections (85/100)
- `2026-04-06T10:24:04.190Z` [WARNING] database: database marked as affected component
- `2026-04-06T10:24:04.190Z` [WARNING] api: api marked as affected component
- `2026-04-06T10:24:04.190Z` [P2] database: Incident promoted: Database connection exhaustion affecting database, api
- `2026-04-06T10:24:04.190Z` [INFO] intelligence-core: Evidence snapshot captured
- `2026-04-06T10:24:04.190Z` [INFO] intelligence-core: Runbook linked: runbooks/db-exhaustion.md
- `2026-04-06T10:24:04.983Z` [ERROR] database: Too many database connections (86/100)
- `2026-04-06T10:24:06.983Z` [ERROR] api: API write failed: connection timeout

## Recommended Next Actions

1. Review the linked runbook: runbooks/db-exhaustion.md
2. Inspect the evidence bundle for detailed logs and state
3. Check the affected services for ongoing degradation
4. Escalate to engineering if root cause requires code change

**Runbook**: runbooks/db-exhaustion.md
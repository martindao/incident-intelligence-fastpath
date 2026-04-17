# Incident: Database connection exhaustion affecting database, api

| Field | Value |
|---|---|
| **ID** | inc_001 |
| **Severity** | P2 |
| **Status** | open |
| **Opened** | 2026-04-17T10:27:54.443Z |
| **Primary Service** | database |
| **Affected Components** | database, api |

## What Happened

The intelligence core detected 4 correlated events
across 2 service(s) within the correlation window.
The probable origin is **database**
(80% confidence): earliest repeated failure in correlation window (3 events). Cloud-service analysis: RDS connection pool exhaustion detected. 3 connection failures from database indicate RDS instance under pressure.

## Evidence Captured

- Queue depth at capture: 0
- Failed jobs: 0
- Processed jobs: 0
- DB connections: 85/100
- Component health: api=operational, job-worker=operational, queue=operational, database=degraded

## Timeline Highlights

- `2026-04-17T10:17:02.359Z` [ERROR] database: First anomaly detected: Too many database connections (85/100)
- `2026-04-17T10:17:03.359Z` [ERROR] database: Too many database connections (86/100)
- `2026-04-17T10:17:05.359Z` [ERROR] api: API write failed: connection timeout
- `2026-04-17T10:27:54.443Z` [WARNING] database: database marked as affected component
- `2026-04-17T10:27:54.443Z` [WARNING] api: api marked as affected component
- `2026-04-17T10:27:54.443Z` [P2] database: Incident promoted: Database connection exhaustion affecting database, api
- `2026-04-17T10:27:54.443Z` [INFO] intelligence-core: Evidence snapshot captured
- `2026-04-17T10:27:54.443Z` [INFO] intelligence-core: Runbook linked: runbooks/db-exhaustion.md

## AWS-flavored incident context

**Account**: 123456789012
**Region**: us-east-1
**Event Type Code**: AWS_RDS_CONNECTION_EXHAUSTION

**Impacted AWS Services**:
- RDS: `arn:aws:rds:us-east-1:123456789012:db:database` (degraded)
- ALB: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/api` (degraded)

## Cloud dependency analysis during escalation

Database connection exhaustion affecting database, api. RDS connection pool saturation propagates failures to dependent services. Check connection pool sizing and long-running queries.

**Routing Artifact**: docs/incident-ops/cloud-service-topology.md

## Blast radius and likely remediation path

**Affected ARNs**:
- arn:aws:rds:us-east-1:123456789012:db:database
- arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/api

**Likely Remediation Path**:
1. Isolate the primary degraded service to prevent cascade
2. Scale consumers if queue backlog detected
3. Review connection pool sizing if RDS exhaustion
4. Consult routing artifact for service-specific escalation

## Recommended Next Actions

1. Review the linked runbook: runbooks/db-exhaustion.md
2. Inspect the evidence bundle for detailed logs and state
3. Check the affected services for ongoing degradation
4. Escalate to engineering if root cause requires code change

**Runbook**: runbooks/db-exhaustion.md
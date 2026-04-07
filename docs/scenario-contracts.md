# Deterministic Scenario Contracts

## Scenario 1: Poison-Pill Job Payload

### Trigger
Inject a malformed job payload into the queue that the worker cannot process.

### Expected Telemetry
- Worker logs: repeated `ERROR: payload validation failed` for same job_id
- Queue depth: increases as failed jobs are requeued or stuck
- API: returns 202 Accepted (superficially healthy)
- Worker: enters retry loop on same payload

### Expected Intelligence Core Behavior
- Collects repeated worker failure events with same correlation_key
- Dwell-time bucket groups 5+ related failures within 15-30s window
- Promotes one incident with worker as probable_origin
- Identifies queue as downstream impact

### Expected Artifacts
- `incident.json`: worker identified as origin, queue as affected
- `evidence-bundle.json`: malformed payload metadata, queue depth snapshot
- `summary.md`: describes poison-pill pattern and isolation steps
- `timeline.json`: chronological worker failures → promotion → evidence capture

### Linked Runbook
`runbooks/poison-pill-job.md`

---

## Scenario 2: Queue Backlog / Worker Slowdown

### Trigger
Artificially slow down worker processing (e.g., add delay or reduce worker count).

### Expected Telemetry
- Queue depth: steadily increases over time
- Worker logs: `WARN: processing delayed`, `WARN: queue depth threshold exceeded`
- API: jobs accepted but completion time increases
- Component health: queue transitions to degraded

### Expected Intelligence Core Behavior
- Collects queue depth warnings and worker delay events
- Dwell-time bucket groups related signals
- Promotes incident when queue depth threshold crossed
- Identifies worker + queue as degraded components

### Expected Artifacts
- `incident.json`: queue backlog as primary issue, worker as contributing
- `evidence-bundle.json`: queue metrics snapshot, worker processing times
- `summary.md`: describes delayed processing impact and scaling guidance
- `timeline.json`: queue depth growth → threshold breach → promotion

### Linked Runbook
`runbooks/queue-backlog.md`

---

## Scenario 3: DB Connection Exhaustion

### Trigger
Simulate DB connection pool exhaustion (e.g., reduce max connections or hold connections open).

### Expected Telemetry
- DB logs: `ERROR: too many connections`, `ERROR: connection timeout`
- Worker logs: intermittent write failures, stale state
- API logs: delayed responses, partial job state writes
- Component health: database transitions to degraded

### Expected Intelligence Core Behavior
- Collects DB errors from multiple sources (worker, API)
- Identifies DB as shared failure origin across services
- Promotes incident with DB as probable_origin
- Marks api + worker as affected components

### Expected Artifacts
- `incident.json`: DB as shared origin, api + worker affected
- `evidence-bundle.json`: connection pool snapshot, recent DB errors
- `summary.md`: describes stale state risk and connection recovery path
- `timeline.json`: DB errors → cascading failures → promotion

### Linked Runbook
`runbooks/db-exhaustion.md`

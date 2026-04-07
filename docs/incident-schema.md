# Schema Definitions

## Event Schema
Raw machine observation ingested from the app-under-test.

```json
{
  "id": "evt_001",
  "timestamp": "2026-04-05T10:12:30.000Z",
  "source": "worker",
  "service": "job-worker",
  "severity": "warning",
  "type": "job_processing_failed",
  "correlation_key": "job_9a2f",
  "message": "payload validation failed",
  "metadata": {
    "tenant_id": "tenant_42",
    "job_id": "job_9a2f",
    "trace_id": "trace_abcd"
  },
  "raw": {}
}
```

### Fields
| Field | Type | Required | Description |
|---|---|---|---|
| id | string | yes | Unique event identifier |
| timestamp | string (ISO 8601) | yes | When the event occurred |
| source | string | yes | Origin component (api, worker, queue, db) |
| service | string | yes | Logical service name |
| severity | string | yes | info, warning, error, critical |
| type | string | yes | Event classification |
| correlation_key | string | yes | Groups related events (job_id, tenant_id, trace_id) |
| message | string | yes | Human-readable description |
| metadata | object | no | Additional context (tenant, job, trace) |
| raw | object | no | Original unparsed payload |

---

## Incident Schema
Promoted human-actionable object created from correlated events.

```json
{
  "id": "inc_001",
  "status": "open",
  "severity": "P1",
  "title": "Job worker backlog caused delayed processing",
  "opened_at": "2026-04-05T10:13:00.000Z",
  "promoted_from_event_bucket": "bucket_003",
  "primary_service": "job-worker",
  "affected_components": ["api", "job-worker", "database"],
  "probable_origin": {
    "service": "job-worker",
    "confidence": 0.82,
    "reason": "earliest repeated failure in correlation window"
  },
  "timeline_ref": "artifacts/inc_001/timeline.json",
  "evidence_ref": "artifacts/inc_001/evidence-bundle.json",
  "summary_ref": "artifacts/inc_001/summary.md",
  "runbook_ref": "runbooks/queue-backlog.md",
  "correlated_events": ["evt_001", "evt_002", "evt_003"]
}
```

### Fields
| Field | Type | Required | Description |
|---|---|---|---|
| id | string | yes | Unique incident identifier |
| status | string | yes | open, investigating, mitigating, resolved |
| severity | string | yes | P1, P2, P3 |
| title | string | yes | Concise incident description |
| opened_at | string (ISO 8601) | yes | When incident was promoted |
| promoted_from_event_bucket | string | yes | Source bucket identifier |
| primary_service | string | yes | Most likely originating service |
| affected_components | array | yes | All impacted services/components |
| probable_origin | object | yes | service, confidence (0-1), reason |
| timeline_ref | string | yes | Path to timeline artifact |
| evidence_ref | string | yes | Path to evidence bundle |
| summary_ref | string | yes | Path to summary markdown |
| runbook_ref | string | yes | Path to linked runbook |
| correlated_events | array | yes | Event IDs that triggered this incident |

---

## Timeline Entry Schema
Single chronological entry in the incident timeline.

```json
{
  "timestamp": "2026-04-05T10:12:30.000Z",
  "type": "event",
  "service": "job-worker",
  "severity": "error",
  "message": "Job processing failed: invalid payload schema",
  "event_id": "evt_001"
}
```

### Types
- `event` — raw correlated event
- `state_change` — service/component status change
- `promotion` — incident was promoted from bucket
- `evidence_captured` — evidence snapshot was taken
- `runbook_recommended` — runbook was linked
- `operator_note` — manual note (flagship feature)

---

## Evidence Bundle Schema
Immutable snapshot captured at incident promotion time.

```json
{
  "incident_id": "inc_001",
  "captured_at": "2026-04-05T10:13:00.000Z",
  "checksum": "sha256:abc123...",
  "scenario_id": "queue-backlog",
  "component_health": {
    "api": "operational",
    "job-worker": "degraded",
    "queue": "degraded",
    "database": "operational"
  },
  "queue_depth": 847,
  "recent_logs": [
    {"timestamp": "...", "service": "job-worker", "message": "..."},
    {"timestamp": "...", "service": "job-worker", "message": "..."}
  ],
  "db_status": {
    "active_connections": 12,
    "max_connections": 100,
    "recent_errors": 0
  },
  "triggering_events": ["evt_001", "evt_002", "evt_003"]
}
```

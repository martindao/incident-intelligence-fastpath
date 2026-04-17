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

---

## AWS Context Schema
Cloud-infrastructure context attached to incidents involving AWS services. Only present when cloud-pattern events are detected.

```json
{
  "account_id": "123456789012",
  "region": "us-east-1",
  "impacted_services": [
    {
      "service": "RDS",
      "arn": "arn:aws:rds:us-east-1:123456789012:db:database",
      "status": "degraded"
    },
    {
      "service": "SQS",
      "arn": "arn:aws:sqs:us-east-1:123456789012:queue",
      "status": "degraded"
    }
  ],
  "event_type_code": "AWS_RDS_CONNECTION_EXHAUSTION",
  "blast_radius": [
    "arn:aws:rds:us-east-1:123456789012:db:database",
    "arn:aws:sqs:us-east-1:123456789012:queue"
  ],
  "dependency_notes": "Database connection exhaustion affecting database, queue. RDS connection pool saturation propagates failures to dependent services. Check connection pool sizing and long-running queries.",
  "routing_artifact_ref": "docs/incident-ops/cloud-service-topology.md"
}
```

### Fields
| Field | Type | Required | Description |
|---|---|---|---|
| account_id | string | yes | AWS account identifier (12-digit) |
| region | string | yes | AWS region where incident originated |
| impacted_services | array | yes | List of AWS services affected with ARN and status |
| event_type_code | string | yes | Standardized AWS event classification code |
| blast_radius | array | yes | ARNs of all resources potentially affected |
| dependency_notes | string | yes | Human-readable explanation of service dependencies |
| routing_artifact_ref | string | yes | Path to cloud service topology documentation |

### Event Type Codes
| Code | Description |
|---|---|
| AWS_RDS_CONNECTION_EXHAUSTION | Database connection pool saturation |
| AWS_SQS_QUEUE_BACKLOG | Queue message accumulation threshold exceeded |
| AWS_LAMBDA_EXECUTION_FAILURE | Lambda function execution errors |
| AWS_LAMBDA_EXECUTION_DELAY | Lambda execution latency elevated |
| AWS_ALB_LATENCY_ELEVATED | Application Load Balancer latency high |
| AWS_ALB_ERROR_RATE_ELEVATED | ALB error rate above threshold |
| AWS_INFRASTRUCTURE_ALERT | Generic infrastructure alert (fallback) |

### Backward Compatibility Note
When AWS context is absent, incidents render with existing fields only. The `aws_context` field is optional and only populated for cloud-pattern incidents. Consumers must gracefully handle incidents without this field.

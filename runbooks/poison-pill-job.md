# Runbook: Poison-Pill Job Payload

## Symptom
- Worker repeatedly fails on the same job with `payload validation failed`
- Queue depth increases as failed jobs accumulate
- API returns 202 Accepted (superficially healthy)
- Same correlation_key appears in multiple error events

## First Checks
1. Check worker logs for repeated failures on same job_id
2. Inspect the failing job payload for schema violations
3. Verify queue depth trend (increasing = backlog growing)
4. Check if API is still accepting new jobs normally

## Evidence to Inspect
- Evidence bundle: `artifacts/incidents/<id>/evidence-bundle.json`
- Timeline: `artifacts/incidents/<id>/timeline.json`
- Recent worker logs showing repeated same-payload failures
- Queue depth at time of incident promotion

## Likely Cause
- Malformed or corrupted job payload entered the queue
- Worker cannot deserialize or validate the payload
- Job is requeued or stuck in retry loop
- Each retry generates additional error events

## Safe Mitigation
1. **Isolate the poison pill**: Move the failing job to a dead-letter queue
2. **Clear the backlog**: Skip or archive the poison-pill job
3. **Resume processing**: Restart worker with clean queue state
4. **Investigate source**: Trace how the malformed payload entered the system
5. **Add validation**: Implement pre-queue payload validation at API layer

## Escalation Guidance
- **P1**: If poison pill is blocking critical business workflows (payments, notifications)
- **P2**: If queue backlog is growing but non-critical jobs are still processing
- **P3**: If isolated to a single tenant with no downstream impact

Escalate to engineering if:
- The malformed payload pattern suggests a systemic schema change
- Multiple tenants are affected simultaneously
- The poison pill cannot be isolated without data loss

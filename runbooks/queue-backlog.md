# Runbook: Queue Backlog / Worker Slowdown

## Symptom
- Queue depth steadily increasing over time
- Worker processing delays reported in logs
- Jobs accepted by API but completion time increasing
- Customer-facing delays in background job results

## First Checks
1. Check current queue depth vs normal baseline
2. Review worker processing times (average, p95, p99)
3. Check if worker count is sufficient for current load
4. Verify no external dependency slowdowns (DB, APIs)

## Evidence to Inspect
- Evidence bundle: queue depth snapshot and worker processing times
- Timeline: queue depth growth pattern over time
- Worker logs showing delay warnings
- API response times for job submission vs completion

## Likely Cause
- Worker processing capacity insufficient for current job volume
- External dependency slowdown (DB queries, API calls)
- Memory leak or resource exhaustion in worker process
- Inefficient job processing logic

## Safe Mitigation
1. **Scale workers**: Add additional worker instances if possible
2. **Prioritize critical jobs**: Process high-priority jobs first
3. **Clear stale jobs**: Remove or requeue jobs stuck beyond timeout
4. **Investigate root cause**: Check worker resource usage and external dependencies
5. **Implement backpressure**: Add queue depth alerts and auto-scaling triggers

## Escalation Guidance
- **P1**: If queue backlog is causing customer-facing SLA breaches
- **P2**: If backlog is growing but within acceptable thresholds
- **P3**: If backlog is stable and not impacting customers

Escalate to engineering if:
- Worker scaling does not resolve the backlog
- Root cause appears to be a code-level performance regression
- External dependency is the bottleneck and requires infrastructure changes

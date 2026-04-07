# Runbook: Database Connection Exhaustion

## Symptom
- DB connection errors in worker and API logs
- Intermittent job state write failures
- Stale or inconsistent processing status
- Multiple services reporting DB-related failures simultaneously

## First Checks
1. Check active DB connections vs max pool size
2. Identify which services are holding connections open
3. Check for long-running queries or connection leaks
4. Verify DB server health (CPU, memory, disk I/O)

## Evidence to Inspect
- Evidence bundle: connection pool snapshot and recent DB errors
- Timeline: DB error pattern across services
- Worker logs showing connection timeout failures
- API logs showing delayed responses due to DB waits

## Likely Cause
- Connection pool exhaustion from too many concurrent operations
- Connection leak: connections not being returned to pool
- Long-running queries blocking connection release
- DB server resource exhaustion (CPU, memory, disk)

## Safe Mitigation
1. **Identify connection holders**: Find which processes are consuming connections
2. **Kill long-running queries**: Terminate queries exceeding timeout thresholds
3. **Restart connection pools**: Gracefully restart affected services to reset pools
4. **Increase pool size temporarily**: If safe, increase max connections as stopgap
5. **Implement connection timeouts**: Ensure all connections have reasonable timeouts

## Escalation Guidance
- **P1**: If DB exhaustion is causing data loss or customer-facing failures
- **P2**: If intermittent failures are affecting some tenants
- **P3**: If connection usage is high but no failures yet

Escalate to engineering if:
- Connection leaks require code-level fixes
- DB server requires scaling or optimization
- Schema changes are needed to reduce query complexity

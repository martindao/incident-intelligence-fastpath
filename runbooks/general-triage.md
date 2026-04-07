# Runbook: General Triage

## Symptom
- Unspecified incident detected by intelligence core
- Multiple services showing degraded health
- No clear single-point origin identified

## First Checks
1. Review the incident timeline for earliest anomaly
2. Check component health for all services
3. Inspect evidence bundle for queue depth, DB connections, and recent logs
4. Identify if the incident is app-level or infrastructure-level

## Evidence to Inspect
- Evidence bundle: `artifacts/incidents/<id>/evidence-bundle.json`
- Timeline: `artifacts/incidents/<id>/timeline.json`
- Summary: `artifacts/incidents/<id>/summary.md`

## Likely Cause
- Depends on the probable_origin identified by the intelligence core
- Check the correlated_events for the earliest failure signal
- Cross-reference with recent deployments or configuration changes

## Safe Mitigation
1. Follow the probable_origin guidance in the incident record
2. If origin is unclear, start with the service showing the most errors
3. Escalate to engineering if root cause requires code investigation
4. Document findings for post-incident review

## Escalation Guidance
- **P1**: Multiple services degraded with customer impact
- **P2**: Single service degraded with partial customer impact
- **P3**: Single service degraded with no customer impact

# Probable Origin Analysis

## Overview

This document explains how telemetry signals are correlated to identify the probable origin of cloud-service incidents. Use this analysis framework when diagnosing multi-service alerts during support escalation.

---

## Diagnosis Framework

### Symptom → First Checks → Evidence → Cause → Mitigation → Escalation

Every incident diagnosis follows this progression:

1. **Symptom:** What alerts are firing?
2. **First Checks:** What metrics confirm the symptom?
3. **Evidence:** What logs and traces support the hypothesis?
4. **Cause:** What is the probable origin?
5. **Mitigation:** What safe actions can stabilize?
6. **Escalation:** Who needs to be involved?

---

## Blast Radius

### What Is Blast Radius?

Blast radius measures how far an incident's impact propagates through the service dependency graph. A small blast radius means the issue is contained to one service. A large blast radius means multiple downstream services are affected.

### Blast Radius Classification

| Level | Scope | Example |
|-------|-------|---------|
| **Contained** | Single service | Lambda function timeout |
| **Adjacent** | Direct dependencies | RDS connection exhaustion affecting ECS tasks |
| **Cascading** | Multiple downstream services | ALB failure causing Route53 health check failures |
| **System-wide** | All services | Network partition affecting all AWS regions |

### How Blast Radius Propagates

```
Origin Service
    |
    v
Direct Dependencies (immediate impact)
    |
    v
Indirect Dependencies (delayed impact)
    |
    v
External Integrations (customer-visible impact)
```

### Blast Radius Assessment Steps

1. **Identify the origin service** from alert correlation
2. **Map direct dependencies** using the service topology
3. **Check health status** of each dependent service
4. **Estimate customer impact** based on affected services
5. **Classify blast radius** (contained, adjacent, cascading, system-wide)

---

## Cloud-Service Correlation Logic

### How Telemetry Becomes a Cloud Incident Hypothesis

The intelligence core correlates alerts using these rules:

#### Rule 1: Temporal Correlation

Alerts firing within a 30-second window are grouped together. This catches cascading failures where one service failure triggers alerts in dependent services.

**Example:**
```
T+0s:   RDS connection_count_high (warning)
T+15s:  ECS task_health_degraded (warning)
T+25s:  ALB target_health_failed (critical)
→ Correlated incident: RDS connection exhaustion cascading to ECS/ALB
```

#### Rule 2: Dependency Path Matching

Alerts are correlated if they appear on the same dependency path. The service topology defines valid correlation paths.

**Valid Paths:**
- RDS → ECS/EKS → ALB → Route53
- SQS → Lambda
- ALB → ECS/EKS

**Invalid Correlations:**
- Route53 → RDS (no direct dependency)
- Lambda → EKS (no direct dependency)

#### Rule 3: Severity Promotion

When multiple alerts correlate, the highest severity becomes the incident severity. Critical alerts in any correlated service promote the entire incident.

**Promotion Rules:**
- Any critical → Incident is critical
- Multiple warnings → Incident promoted to warning
- Single warning → Incident remains informational

#### Rule 4: Probable Origin Inference

The probable origin is the **most upstream service** showing symptoms. Upstream is defined by the dependency graph.

**Origin Inference Examples:**

| Alerts | Probable Origin | Reasoning |
|--------|-----------------|-----------|
| RDS + ECS + ALB | RDS | RDS is upstream of ECS and ALB |
| SQS + Lambda | SQS | SQS is upstream of Lambda consumers |
| ALB + Route53 | ALB | ALB is upstream of Route53 health checks |

---

## Remediation Path

### Operator Guidance by Probable Origin

#### RDS as Probable Origin

**Symptoms:**
- Connection pool exhaustion
- Query latency spikes
- Replication lag

**Immediate Actions:**
1. Check connection count: `SELECT count(*) FROM pg_stat_activity;`
2. Identify long-running queries
3. Check for blocking locks

**Safe Mitigation:**
- Kill specific long-running queries (not all connections)
- Scale down non-critical workers
- Pause background jobs if pool is full

**Escalation Criteria:**
- Database completely unresponsive → Page DBA
- Disk space critical → Page DBA
- Replication broken → Page DBA

---

#### SQS as Probable Origin

**Symptoms:**
- Message backlog growing
- DLQ filling rapidly
- Consumer lag increasing

**Immediate Actions:**
1. Check `ApproximateNumberOfMessages` metric
2. Review DLQ for message patterns
3. Verify consumer health

**Safe Mitigation:**
- Increase visibility timeout if consumers are slow
- Add temporary consumers to drain backlog
- Replay DLQ messages after fixing root cause

**Escalation Criteria:**
- Backlog exceeds 1M messages → Page consumer team
- DLQ contains critical messages → Page application team
- Consumer service down → Page platform team

---

#### ALB as Probable Origin

**Symptoms:**
- 5xx errors from load balancer
- Target registration failures
- Latency at ingress

**Immediate Actions:**
1. Check target group health
2. Review ALB access logs
3. Verify listener configuration

**Safe Mitigation:**
- Remove unhealthy targets manually if auto-deregistration fails
- Adjust health check thresholds temporarily
- Enable cross-zone load balancing if not enabled

**Escalation Criteria:**
- All targets unhealthy → Page container team
- ALB capacity issues → Page AWS support
- SSL certificate issues → Page security team

---

#### Lambda as Probable Origin

**Symptoms:**
- Function timeout errors
- Cold start latency spikes
- Throttle errors

**Immediate Actions:**
1. Check CloudWatch Logs for errors
2. Review Lambda metrics dashboard
3. Verify execution role permissions

**Safe Mitigation:**
- Increase timeout if function needs more time
- Request concurrency quota increase if throttling
- Provisioned concurrency for latency-sensitive functions

**Escalation Criteria:**
- Function errors exceed 10% → Page application team
- Throttle errors sustained → Page capacity team
- Permission errors → Page security team

---

#### ECS/EKS as Probable Origin

**Symptoms:**
- Task/Pod launch failures
- Container health check failures
- Service discovery issues

**Immediate Actions:**
1. Check task/pod status
2. Review CloudWatch/CloudWatch Logs
3. Verify resource limits

**Safe Mitigation:**
- Scale down non-critical services to free resources
- Adjust health check grace periods
- Restart failed tasks/pods

**Escalation Criteria:**
- Platform-level failures → Page container platform team
- Resource exhaustion → Page capacity team
- Application errors → Page application team

---

## Evidence Collection Checklist

When diagnosing probable origin, collect:

### For All Incidents
- [ ] Timeline of alerts (first to last)
- [ ] Affected services list
- [ ] Customer impact assessment
- [ ] Recent changes (deployments, config changes)

### For RDS Incidents
- [ ] Connection pool metrics
- [ ] Slow query log excerpt
- [ ] Lock wait statistics
- [ ] Replication status

### For SQS Incidents
- [ ] Queue depth over time
- [ ] DLQ message count
- [ ] Consumer health status
- [ ] Message age distribution

### For ALB Incidents
- [ ] Target health status
- [ ] Access log errors
- [ ] Latency percentiles
- [ ] Request count trends

### For Lambda Incidents
- [ ] Invocation error rate
- [ ] Duration percentiles
- [ ] Cold start frequency
- [ ] Throttle count

### For ECS/EKS Incidents
- [ ] Task/Pod status
- [ ] Container logs
- [ ] Resource utilization
- [ ] Service discovery status

---

## Related Documents

- [Cloud Service Topology](./cloud-service-topology.md)
- [General Triage Runbook](../../runbooks/general-triage.md)
- [Connection Storm Runbook](../../runbooks/connection-storm.md)

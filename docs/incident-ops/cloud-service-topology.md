# Cloud Service Topology

## Overview

This document maps the AWS service dependencies for incident routing and diagnosis. Use this topology to trace impact propagation when alerts fire across multiple services.

---

## Service Dependency Path

```
                                    Route53
                                        |
                                        | DNS Resolution
                                        v
                                    +-------+
                                    |  ALB  |  Application Load Balancer
                                    +-------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
              +----------+       +----------+       +----------+
              |   ECS    |       |   EKS    |       |  Lambda  |
              | (Fargate)|       | (Pods)   |       |(Functions)|
              +----------+       +----------+       +----------+
                    |                   |                   |
                    |                   |                   |
                    +-------------------+-------------------+
                                        |
                                        | Service Layer
                                        v
                              +-------------------+
                              |       SQS         |  Message Queue
                              |   (Dead Letter    |
                              |    Queue attached)|
                              +-------------------+
                                        |
                                        | Async Processing
                                        v
                              +-------------------+
                              |       RDS         |  PostgreSQL
                              |   (Multi-AZ)      |
                              +-------------------+
                                        |
                              +-------------------+
                              |  Read Replicas    |
                              +-------------------+
```

---

## Incident Routing by Service

### Route53 (DNS Layer)

**Symptoms:**
- DNS resolution failures
- Health check failures
- Failover not triggering

**First Checks:**
1. Check Route53 health check status
2. Verify DNS propagation across regions
3. Confirm ALB target group health

**Incident Routing:**
- If DNS fails → Route53 team
- If health check fails but ALB healthy → Route53 configuration issue
- If failover not working → Check routing policy and health check thresholds

---

### ALB (Application Load Balancer)

**Symptoms:**
- 5xx errors from load balancer
- Target registration failures
- Latency spikes at ingress

**First Checks:**
1. Check target group health
2. Review ALB access logs for error patterns
3. Verify listener rules and routing configuration

**Incident Routing:**
- If targets unhealthy → Route to container team (ECS/EKS)
- If ALB 5xx with healthy targets → ALB configuration or capacity issue
- If latency at ALB level → Network team

---

### ECS (Elastic Container Service)

**Symptoms:**
- Task launch failures
- Service discovery issues
- Container health check failures

**First Checks:**
1. Check task definition status
2. Review CloudWatch metrics for CPU/memory
3. Verify service discovery configuration

**Incident Routing:**
- If task fails to start → ECS platform team
- If container OOM → Application team (memory leak)
- If service discovery broken → Route to service mesh team

---

### EKS (Elastic Kubernetes Service)

**Symptoms:**
- Pod scheduling failures
- Node group issues
- Control plane unresponsive

**First Checks:**
1. Check node group status
2. Review pod events and conditions
3. Verify control plane logs

**Incident Routing:**
- If pods pending → Capacity team (node scaling)
- If control plane issues → EKS platform team
- If application errors → Application team

---

### Lambda (Serverless Functions)

**Symptoms:**
- Function timeout errors
- Cold start latency spikes
- Invocation failures

**First Checks:**
1. Check CloudWatch Logs for function errors
2. Review Lambda metrics (duration, errors, throttles)
3. Verify IAM execution role permissions

**Incident Routing:**
- If timeout → Application team (function optimization)
- If throttle → Capacity team (concurrency limits)
- If permission errors → Security team

---

### SQS (Simple Queue Service)

**Symptoms:**
- Message backlog growth
- Dead letter queue filling
- Visibility timeout issues

**First Checks:**
1. Check queue metrics (ApproximateNumberOfMessages)
2. Review DLQ for failed messages
3. Verify consumer health

**Incident Routing:**
- If backlog growing → Consumer team (processing capacity)
- If DLQ filling → Application team (message handling)
- If visibility timeout issues → Consumer configuration team

---

### RDS (Relational Database Service)

**Symptoms:**
- Connection pool exhaustion
- Query latency spikes
- Replication lag

**First Checks:**
1. Check CloudWatch metrics (CPU, connections, IOPS)
2. Review slow query logs
3. Verify replica status

**Incident Routing:**
- If connection exhaustion → Application team (pool sizing)
- If query latency → DBA team
- If replication lag → Database platform team

---

## Cross-Service Incident Patterns

### Pattern 1: Cascading Failure from RDS

```
RDS connection pool exhaustion
    |
    v
ECS/EKS tasks fail health checks
    |
    v
ALB marks targets unhealthy
    |
    v
Route53 health check fails (if configured)
```

**Routing:** Start with DBA team, escalate to application team for pool configuration.

---

### Pattern 2: SQS Backlog Cascading to Lambda

```
SQS message backlog grows
    |
    v
Lambda invocation rate spikes
    |
    v
Lambda throttle errors
    |
    v
DLQ fills rapidly
```

**Routing:** Start with consumer team, escalate to capacity team for concurrency limits.

---

### Pattern 3: ALB Target Registration Loop

```
ECS task fails health check
    |
    v
ALB deregisters target
    |
    v
ECS replaces task
    |
    v
New task fails health check (repeats)
```

**Routing:** Application team for container health, ECS platform team for task definition.

---

## Quick Reference: Service to Team Mapping

| Service | Primary Team | Escalation Path |
|---------|--------------|-----------------|
| Route53 | Network/DNS | Cloud Platform |
| ALB | Network | Cloud Platform |
| ECS | Container Platform | Cloud Platform |
| EKS | Container Platform | Cloud Platform |
| Lambda | Serverless Platform | Cloud Platform |
| SQS | Messaging | Cloud Platform |
| RDS | DBA | Database Platform |

---

## Related Documents

- [Probable Origin Analysis](./probable-origin-analysis.md)
- [General Triage Runbook](../../runbooks/general-triage.md)
- [Connection Storm Runbook](../../runbooks/connection-storm.md)

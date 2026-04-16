import type { Scenario, ScenarioId } from './types';

function makeEvents(
  baseId: string,
  pattern: Array<{ service: Scenario['events'][number]['service']; severity: Scenario['events'][number]['severity']; message: string; count: number; startMs: number; intervalMs: number }>
): Scenario['events'] {
  const events: Scenario['events'] = [];
  let idx = 0;
  for (const p of pattern) {
    for (let i = 0; i < p.count && idx < 50; i++) {
      events.push({
        id: `${baseId}-${String(idx).padStart(3, '0')}`,
        timestamp: p.startMs + i * p.intervalMs,
        service: p.service,
        severity: p.severity,
        message: p.message,
      });
      idx++;
    }
  }
  // Trim or pad to exactly 50
  return events.slice(0, 50);
}

export const scenarios: Record<ScenarioId, Scenario> = {
  'poison-pill': {
    id: 'poison-pill',
    label: 'Poison Pill in Payment Queue',
    description: 'A malformed message in the payment-worker queue causes repeated processing failures, cascading into 502 errors and queue backup.',
    severity: 'P1',
    events: makeEvents('pp', [
      { service: 'payment-worker', severity: 'error', message: 'Poison pill message detected: invalid JSON payload in msg-8847', count: 8, startMs: 0, intervalMs: 200 },
      { service: 'payment-worker', severity: 'critical', message: 'Retry attempt 3/3 failed for msg-8847 — moving to DLQ', count: 5, startMs: 1800, intervalMs: 300 },
      { service: 'api-gateway', severity: 'warning', message: 'Upstream timeout on POST /api/v2/payments — 502 Bad Gateway', count: 8, startMs: 2400, intervalMs: 250 },
      { service: 'api-gateway', severity: 'error', message: 'Circuit breaker OPEN for payment-worker pool (failures=12, threshold=10)', count: 5, startMs: 4400, intervalMs: 300 },
      { service: 'worker-queue', severity: 'warning', message: 'Queue depth exceeding threshold: depth=1,247 (warn=500)', count: 6, startMs: 5000, intervalMs: 400 },
      { service: 'worker-queue', severity: 'error', message: 'Queue depth critical: depth=3,891 — consumers falling behind', count: 5, startMs: 7400, intervalMs: 300 },
      { service: 'database', severity: 'warning', message: 'Connection pool utilization spike: 78/100 active connections', count: 5, startMs: 8000, intervalMs: 300 },
      { service: 'database', severity: 'error', message: 'Connection pool near exhaustion: 96/100 — queuing requests', count: 5, startMs: 9500, intervalMs: 200 },
      { service: 'payment-worker', severity: 'critical', message: 'Worker process OOM killed — restarting (exit code 137)', count: 3, startMs: 9800, intervalMs: 100 },
    ]),
    incident: {
      id: 'INC-2026-0401',
      title: 'P1: Poison Pill in Payment Processing Queue',
      severity: 'P1',
      probable_origin: {
        service: 'payment-worker',
        confidence: 0.95,
        reason: 'First failure originated in payment-worker with poison pill message; all downstream failures are cascading effects.',
      },
      created_at: '2026-04-01T14:23:00Z',
      event_count: 50,
      runbook_ref: 'runbooks/poison-pill-job.md',
    },
    timeline: [
      { timestamp: '14:23:00', service: 'payment-worker', severity: 'error', message: 'Poison pill message detected: invalid JSON payload in msg-8847' },
      { timestamp: '14:23:02', service: 'payment-worker', severity: 'critical', message: 'Retry attempt 3/3 failed — moving to DLQ' },
      { timestamp: '14:23:03', service: 'api-gateway', severity: 'warning', message: 'Upstream timeout on POST /api/v2/payments — 502' },
      { timestamp: '14:23:05', service: 'api-gateway', severity: 'error', message: 'Circuit breaker OPEN for payment-worker pool' },
      { timestamp: '14:23:06', service: 'worker-queue', severity: 'warning', message: 'Queue depth exceeding threshold: 1,247' },
      { timestamp: '14:23:08', service: 'worker-queue', severity: 'error', message: 'Queue depth critical: 3,891' },
      { timestamp: '14:23:09', service: 'database', severity: 'warning', message: 'Connection pool utilization spike: 78/100' },
      { timestamp: '14:23:10', service: 'database', severity: 'error', message: 'Connection pool near exhaustion: 96/100' },
      { timestamp: '14:23:10', service: 'payment-worker', severity: 'critical', message: 'Worker process OOM killed — restarting' },
    ],
    evidence: {
      queue_depth: 3891,
      db_connections: { used: 96, max: 100 },
      recent_logs: [
        '[payment-worker] ERROR: Poison pill message detected: invalid JSON payload in msg-8847',
        '[api-gateway] WARN: Circuit breaker OPEN for payment-worker pool (failures=12)',
        '[worker-queue] ERROR: Queue depth critical: depth=3,891 — consumers falling behind',
        '[database] ERROR: Connection pool near exhaustion: 96/100 — queuing requests',
        '[payment-worker] CRITICAL: Worker process OOM killed — restarting (exit code 137)',
      ],
      failed_jobs: 47,
    },
    summaryMd: `# P1: Poison Pill in Payment Processing Queue

## Root Cause
A malformed message (msg-8847) with invalid JSON payload entered the payment-worker queue. After 3 retry attempts, the message was moved to the Dead Letter Queue, but not before causing cascading failures.

## Impact
- **Payment processing**: Fully degraded — all POST /api/v2/payments returning 502
- **Queue depth**: 3,891 messages backed up (normal: <200)
- **Database**: Connection pool at 96% capacity
- **Worker processes**: 3 OOM kills detected

## Recommended Action
1. Drain DLQ and inspect msg-8847 payload
2. Restart payment-worker pods with increased memory limits
3. Add JSON schema validation at queue ingress
4. Monitor queue depth recovery`,
  },

  'queue-backlog': {
    id: 'queue-backlog',
    label: 'Queue Backlog in Worker Pipeline',
    description: 'Gradual queue depth increase in the worker-queue causes payment-worker slowdown, rising API latency, and connection pooling.',
    severity: 'P3',
    events: makeEvents('qb', [
      { service: 'worker-queue', severity: 'info', message: 'Queue depth normal: depth=142 (threshold=500)', count: 5, startMs: 0, intervalMs: 500 },
      { service: 'worker-queue', severity: 'warning', message: 'Queue depth rising: depth=623 — approaching threshold', count: 6, startMs: 2500, intervalMs: 400 },
      { service: 'worker-queue', severity: 'warning', message: 'Queue depth elevated: depth=1,105 — consumer lag detected', count: 6, startMs: 4900, intervalMs: 350 },
      { service: 'payment-worker', severity: 'warning', message: 'Processing latency degraded: avg=2,340ms (p99=4,100ms)', count: 6, startMs: 5500, intervalMs: 400 },
      { service: 'payment-worker', severity: 'error', message: 'Processing timeout: job-5521 exceeded 5,000ms SLA', count: 5, startMs: 7900, intervalMs: 300 },
      { service: 'api-gateway', severity: 'warning', message: 'Response latency elevated: avg=1,890ms on /api/v2/payments', count: 5, startMs: 8500, intervalMs: 300 },
      { service: 'api-gateway', severity: 'warning', message: 'Response latency degraded: avg=3,200ms — approaching timeout', count: 5, startMs: 10000, intervalMs: 300 },
      { service: 'database', severity: 'info', message: 'Connection pool stable: 45/100 active connections', count: 4, startMs: 10500, intervalMs: 400 },
      { service: 'database', severity: 'warning', message: 'Connection pool rising: 68/100 — monitoring', count: 4, startMs: 12100, intervalMs: 300 },
      { service: 'worker-queue', severity: 'warning', message: 'Queue depth plateau: depth=1,847 — consumers at max throughput', count: 4, startMs: 13300, intervalMs: 300 },
    ]),
    incident: {
      id: 'INC-2026-0402',
      title: 'P3: Queue Backlog in Worker Processing Pipeline',
      severity: 'P3',
      probable_origin: {
        service: 'worker-queue',
        confidence: 0.80,
        reason: 'Queue depth began rising before any downstream service degradation; consumer throughput insufficient for incoming message rate.',
      },
      created_at: '2026-04-02T09:15:00Z',
      event_count: 50,
      runbook_ref: 'runbooks/queue-backlog.md',
    },
    timeline: [
      { timestamp: '09:15:00', service: 'worker-queue', severity: 'info', message: 'Queue depth normal: depth=142' },
      { timestamp: '09:15:03', service: 'worker-queue', severity: 'warning', message: 'Queue depth rising: depth=623' },
      { timestamp: '09:15:05', service: 'worker-queue', severity: 'warning', message: 'Queue depth elevated: depth=1,105' },
      { timestamp: '09:15:06', service: 'payment-worker', severity: 'warning', message: 'Processing latency degraded: avg=2,340ms' },
      { timestamp: '09:15:08', service: 'payment-worker', severity: 'error', message: 'Processing timeout: job-5521 exceeded 5,000ms SLA' },
      { timestamp: '09:15:09', service: 'api-gateway', severity: 'warning', message: 'Response latency elevated: avg=1,890ms' },
      { timestamp: '09:15:10', service: 'api-gateway', severity: 'warning', message: 'Response latency degraded: avg=3,200ms' },
      { timestamp: '09:15:12', service: 'database', severity: 'warning', message: 'Connection pool rising: 68/100' },
      { timestamp: '09:15:14', service: 'worker-queue', severity: 'warning', message: 'Queue depth plateau: depth=1,847' },
    ],
    evidence: {
      queue_depth: 1847,
      db_connections: { used: 68, max: 100 },
      recent_logs: [
        '[worker-queue] WARN: Queue depth elevated: depth=1,105 — consumer lag detected',
        '[payment-worker] WARN: Processing latency degraded: avg=2,340ms (p99=4,100ms)',
        '[payment-worker] ERROR: Processing timeout: job-5521 exceeded 5,000ms SLA',
        '[api-gateway] WARN: Response latency degraded: avg=3,200ms — approaching timeout',
        '[worker-queue] WARN: Queue depth plateau: depth=1,847 — consumers at max throughput',
      ],
      failed_jobs: 12,
    },
    summaryMd: `# P3: Queue Backlog in Worker Processing Pipeline

## Root Cause
Incoming message rate exceeded consumer throughput in the worker-queue. Queue depth grew from 142 to 1,847 over 15 seconds, causing cascading latency increases downstream.

## Impact
- **Queue depth**: 1,847 messages (normal: <200)
- **Payment processing**: Degraded — avg latency 3,200ms (SLA: 5,000ms)
- **API gateway**: Elevated response times on /api/v2/payments
- **Failed jobs**: 12 timeouts recorded

## Recommended Action
1. Scale payment-worker consumers horizontally (2 → 4 instances)
2. Review message production rate — consider rate limiting
3. Add auto-scaling policy based on queue depth threshold
4. Monitor backlog drain rate after scaling`,
  },

  'db-exhaustion': {
    id: 'db-exhaustion',
    label: 'Database Connection Pool Exhaustion',
    description: 'Database connection pool exhaustion triggers API gateway timeouts, worker-queue stalls, and payment-worker failures.',
    severity: 'P2',
    events: makeEvents('de', [
      { service: 'database', severity: 'warning', message: 'Connection pool utilization high: 82/100 active connections', count: 5, startMs: 0, intervalMs: 300 },
      { service: 'database', severity: 'error', message: 'Connection pool exhausted: 100/100 — new requests queued', count: 6, startMs: 1500, intervalMs: 250 },
      { service: 'database', severity: 'critical', message: 'Connection wait timeout: 32 requests waiting >5,000ms for available connection', count: 5, startMs: 3000, intervalMs: 300 },
      { service: 'api-gateway', severity: 'warning', message: 'Upstream latency spike: avg=4,200ms on GET /api/v2/accounts', count: 5, startMs: 3500, intervalMs: 300 },
      { service: 'api-gateway', severity: 'error', message: 'Gateway timeout: 504 on GET /api/v2/accounts — upstream did not respond', count: 6, startMs: 5000, intervalMs: 250 },
      { service: 'worker-queue', severity: 'warning', message: 'Consumer stalled: no ack received in 8,000ms — possible deadlock', count: 5, startMs: 5500, intervalMs: 300 },
      { service: 'worker-queue', severity: 'error', message: 'Consumer timeout: job-7734 requeued after 10,000ms stall', count: 5, startMs: 7000, intervalMs: 300 },
      { service: 'payment-worker', severity: 'warning', message: 'Database query failed: connection timeout after 5,000ms', count: 5, startMs: 7500, intervalMs: 250 },
      { service: 'payment-worker', severity: 'error', message: 'Batch processing halted: 18 jobs pending — no database connectivity', count: 4, startMs: 8750, intervalMs: 250 },
      { service: 'database', severity: 'warning', message: 'Connection pool recovering: 88/100 — stale connections released', count: 4, startMs: 9500, intervalMs: 300 },
    ]),
    incident: {
      id: 'INC-2026-0403',
      title: 'P2: Database Connection Pool Exhaustion',
      severity: 'P2',
      probable_origin: {
        service: 'database',
        confidence: 0.85,
        reason: 'Connection pool reached 100/100 before any downstream service reported errors; all subsequent failures are symptoms of database unavailability.',
      },
      created_at: '2026-04-03T16:45:00Z',
      event_count: 50,
      runbook_ref: 'runbooks/db-exhaustion.md',
    },
    timeline: [
      { timestamp: '16:45:00', service: 'database', severity: 'warning', message: 'Connection pool utilization high: 82/100' },
      { timestamp: '16:45:02', service: 'database', severity: 'error', message: 'Connection pool exhausted: 100/100' },
      { timestamp: '16:45:03', service: 'database', severity: 'critical', message: 'Connection wait timeout: 32 requests waiting >5,000ms' },
      { timestamp: '16:45:04', service: 'api-gateway', severity: 'warning', message: 'Upstream latency spike: avg=4,200ms' },
      { timestamp: '16:45:05', service: 'api-gateway', severity: 'error', message: 'Gateway timeout: 504 on GET /api/v2/accounts' },
      { timestamp: '16:45:06', service: 'worker-queue', severity: 'warning', message: 'Consumer stalled: no ack received in 8,000ms' },
      { timestamp: '16:45:07', service: 'worker-queue', severity: 'error', message: 'Consumer timeout: job-7734 requeued after 10,000ms' },
      { timestamp: '16:45:08', service: 'payment-worker', severity: 'warning', message: 'Database query failed: connection timeout' },
      { timestamp: '16:45:09', service: 'payment-worker', severity: 'error', message: 'Batch processing halted: 18 jobs pending' },
      { timestamp: '16:45:10', service: 'database', severity: 'warning', message: 'Connection pool recovering: 88/100' },
    ],
    evidence: {
      queue_depth: 892,
      db_connections: { used: 100, max: 100 },
      recent_logs: [
        '[database] ERROR: Connection pool exhausted: 100/100 — new requests queued',
        '[database] CRITICAL: Connection wait timeout: 32 requests waiting >5,000ms',
        '[api-gateway] ERROR: Gateway timeout: 504 on GET /api/v2/accounts',
        '[worker-queue] ERROR: Consumer timeout: job-7734 requeued after 10,000ms stall',
        '[payment-worker] ERROR: Batch processing halted: 18 jobs pending — no database connectivity',
      ],
      failed_jobs: 31,
    },
    summaryMd: `# P2: Database Connection Pool Exhaustion

## Root Cause
Database connection pool reached maximum capacity (100/100) at 16:45:02. All downstream services dependent on database connectivity experienced timeouts and failures.

## Impact
- **Database**: Fully exhausted — 32 requests waiting >5,000ms
- **API gateway**: 504 timeouts on all database-dependent endpoints
- **Worker queue**: Consumer stalls and job requeues detected
- **Payment worker**: Batch processing halted — 18 jobs pending

## Recommended Action
1. Increase connection pool max from 100 to 200
2. Implement connection pool monitoring with alerting at 80% threshold
3. Add connection leak detection — review unclosed connections in payment-worker
4. Consider read replicas for GET /api/v2/accounts traffic`,
  },
};

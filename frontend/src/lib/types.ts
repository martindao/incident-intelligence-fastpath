export type Severity = 'info' | 'warning' | 'error' | 'critical';
export type ServiceName = 'api-gateway' | 'worker-queue' | 'payment-worker' | 'database';
export type ScenarioId = 'poison-pill' | 'queue-backlog' | 'db-exhaustion';
export type SimulationState = 'idle' | 'running' | 'complete';

export interface AlertEvent {
  id: string;
  timestamp: number; // ms offset from scenario start
  service: ServiceName;
  severity: Severity;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  probable_origin: {
    service: ServiceName;
    confidence: number;
    reason: string;
  };
  created_at: string;
  event_count: number;
  runbook_ref: string;
}

export interface TimelineEntry {
  timestamp: string;
  service: ServiceName;
  severity: Severity;
  message: string;
}

export interface EvidenceBundle {
  queue_depth: number;
  db_connections: { used: number; max: number };
  recent_logs: string[];
  failed_jobs: number;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  severity: 'P1' | 'P2' | 'P3';
  events: AlertEvent[];
  incident: Incident;
  timeline: TimelineEntry[];
  evidence: EvidenceBundle;
  summaryMd: string;
}

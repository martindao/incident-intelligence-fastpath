// intelligence-core/evidence/snapshot.js
// Immutable evidence snapshot captured at incident promotion time from shared runtime store

const crypto = require('crypto');
const store = require('../../runtime/store');

// AWS service mapping for cloud-context evidence
const AWS_SERVICE_MAP = {
  'job-worker': { arn: 'arn:aws:lambda:us-east-1:123456789012:function:job-worker', service: 'Lambda', criticality: 'high' },
  'api': { arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/api-alb', service: 'ALB', criticality: 'high' },
  'queue': { arn: 'arn:aws:sqs:us-east-1:123456789012:job-queue', service: 'SQS', criticality: 'medium' },
  'database': { arn: 'arn:aws:rds:us-east-1:123456789012:db:postgres-primary', service: 'RDS', criticality: 'critical' }
};

// Event type codes for AWS Health event style
const EVENT_TYPE_CODES = {
  'db-exhaustion': 'AWS_RDS_CONNECTION_EXHAUSTION',
  'queue-backlog': 'AWS_SQS_BACKLOG_THRESHOLD',
  'poison-pill-job': 'AWS_LAMBDA_FUNCTION_ERROR',
  'default': 'AWS_INCIDENT_DETECTED'
};

function captureEvidence(incident) {
  const allLogs = store.getNewEvents(0);
  const dbStatus = store.getDBStatus();
  const scenarioId = store.getScenarioMode() || 'unknown';
  const componentHealth = store.getComponentHealth();

  // Build AWS context from component health and scenario
  const awsContext = buildAwsContext(incident, componentHealth, scenarioId);

  const evidence = {
    incident_id: incident.id,
    captured_at: new Date().toISOString(),
    checksum: '',
    scenario_id: scenarioId,
    component_health: componentHealth,
    queue_depth: store.getQueueDepth(),
    recent_logs: allLogs.slice(-20).map(log => ({
      timestamp: log.timestamp,
      service: log.service,
      severity: log.severity,
      message: log.message
    })),
    db_status: {
      active_connections: dbStatus.active_connections,
      max_connections: dbStatus.max_connections,
      recent_errors: dbStatus.recent_errors
    },
    triggering_events: incident.correlated_events,
    failed_jobs_count: store.getFailedJobsCount(),
    processed_jobs_count: store.getProcessedJobsCount(),
    aws_context: awsContext,
    dependency_notes: generateDependencyNotes(incident, componentHealth),
    blast_radius: calculateBlastRadius(incident, componentHealth),
    routing_artifact_ref: 'docs/incident-ops/cloud-service-topology.md'
  };

  // Generate checksum for immutability (must be last, after all fields added)
  const content = JSON.stringify(evidence);
  evidence.checksum = `sha256:${crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)}`;

  return evidence;
}

function buildAwsContext(incident, componentHealth, scenarioId) {
  const services = [];
  const blastRadius = [];

  // Map affected components to AWS services
  for (const [component, status] of Object.entries(componentHealth)) {
    if (AWS_SERVICE_MAP[component]) {
      const serviceInfo = AWS_SERVICE_MAP[component];
      services.push({
        arn: serviceInfo.arn,
        service: serviceInfo.service,
        status: status,
        criticality: serviceInfo.criticality
      });
      if (status !== 'operational') {
        blastRadius.push(serviceInfo.arn);
      }
    }
  }

  return {
    account_id: '123456789012',
    region: 'us-east-1',
    services: services,
    event_type_code: EVENT_TYPE_CODES[scenarioId] || EVENT_TYPE_CODES['default'],
    blast_radius: blastRadius
  };
}

function generateDependencyNotes(incident, componentHealth) {
  const degradedComponents = Object.entries(componentHealth)
    .filter(([_, status]) => status !== 'operational')
    .map(([component, _]) => component);

  if (degradedComponents.length === 0) {
    return 'All cloud services operational. No dependency impact detected.';
  }

  const serviceNames = degradedComponents.map(c => AWS_SERVICE_MAP[c]?.service || c).join(', ');
  return `Cloud service dependencies impacted: ${serviceNames}. Incident may propagate through service topology. Refer to routing artifact for escalation paths.`;
}

function calculateBlastRadius(incident, componentHealth) {
  const blastRadius = [];

  for (const [component, status] of Object.entries(componentHealth)) {
    if (status !== 'operational' && AWS_SERVICE_MAP[component]) {
      blastRadius.push(AWS_SERVICE_MAP[component].arn);
    }
  }

  return blastRadius;
}

module.exports = {
  captureEvidence,
  buildAwsContext,
  generateDependencyNotes,
  calculateBlastRadius
};

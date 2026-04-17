// intelligence-core/promotion/engine.js
// Incident promotion engine: converts correlated event buckets into actionable incidents

let incidentCounter = 0;

// AWS service mapping for cloud-pattern events
const SERVICE_TO_AWS_MAP = {
  'database': { service: 'RDS', arnPrefix: 'arn:aws:rds:us-east-1:123456789012:db:' },
  'db': { service: 'RDS', arnPrefix: 'arn:aws:rds:us-east-1:123456789012:db:' },
  'queue': { service: 'SQS', arnPrefix: 'arn:aws:sqs:us-east-1:123456789012:' },
  'api': { service: 'ALB', arnPrefix: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/' },
  'job-worker': { service: 'Lambda', arnPrefix: 'arn:aws:lambda:us-east-1:123456789012:function:' },
  'worker': { service: 'Lambda', arnPrefix: 'arn:aws:lambda:us-east-1:123456789012:function:' },
  'ecs': { service: 'ECS', arnPrefix: 'arn:aws:ecs:us-east-1:123456789012:service/' },
  'lambda': { service: 'Lambda', arnPrefix: 'arn:aws:lambda:us-east-1:123456789012:function:' }
};

// Cloud-pattern event types that indicate AWS infrastructure issues
const CLOUD_PATTERN_EVENTS = [
  'db_connection_error',
  'queue_depth_high',
  'api_latency_high',
  'api_error_rate_high',
  'worker_timeout',
  'connection_pool_exhaustion'
];

// AWS Health event type codes
const EVENT_TYPE_CODES = {
  'db_connection_error': 'AWS_RDS_CONNECTION_EXHAUSTION',
  'queue_depth_high': 'AWS_SQS_QUEUE_BACKLOG',
  'job_processing_failed': 'AWS_LAMBDA_EXECUTION_FAILURE',
  'job_processing_delayed': 'AWS_LAMBDA_EXECUTION_DELAY',
  'api_latency_high': 'AWS_ALB_LATENCY_ELEVATED',
  'api_error_rate_high': 'AWS_ALB_ERROR_RATE_ELEVATED'
};

/**
 * Detects if the incident involves cloud-pattern events
 * @param {Array} events - Array of correlated events
 * @returns {boolean} - True if cloud-pattern events detected
 */
function isCloudPatternIncident(events) {
  return events.some(e => CLOUD_PATTERN_EVENTS.includes(e.type));
}

/**
 * Maps a service name to its AWS equivalent
 * @param {string} serviceName - Logical service name
 * @returns {object} - AWS service mapping with service name and ARN prefix
 */
function mapToAwsService(serviceName) {
  const normalized = serviceName.toLowerCase().replace(/[-_]/g, '');
  for (const [key, mapping] of Object.entries(SERVICE_TO_AWS_MAP)) {
    if (normalized.includes(key.toLowerCase().replace(/[-_]/g, ''))) {
      return mapping;
    }
  }
  return { service: 'EC2', arnPrefix: 'arn:aws:ec2:us-east-1:123456789012:instance/' };
}

/**
 * Generates AWS context for cloud-pattern incidents
 * @param {object} bucket - Event bucket
 * @param {object} probableOrigin - Determined probable origin
 * @returns {object|null} - AWS context object or null for non-cloud incidents
 */
function generateAwsContext(bucket, probableOrigin) {
  if (!isCloudPatternIncident(bucket.events)) {
    return null;
  }

  const services = [...bucket.services];
  const impactedServices = services.map(serviceName => {
    const awsMapping = mapToAwsService(serviceName);
    return {
      service: awsMapping.service,
      arn: `${awsMapping.arnPrefix}${serviceName}`,
      status: 'degraded'
    };
  });

  // Generate blast radius from all impacted service ARNs
  const blastRadius = impactedServices.map(s => s.arn);

  // Determine event type code
  const primaryEventType = bucket.events[0]?.type || 'unknown';
  const eventTypeCode = EVENT_TYPE_CODES[primaryEventType] || 'AWS_INFRASTRUCTURE_ALERT';

  // Generate dependency notes based on services
  const dependencyNotes = generateDependencyNotes(services, primaryEventType);

  return {
    account_id: '123456789012',
    region: 'us-east-1',
    impacted_services: impactedServices,
    event_type_code: eventTypeCode,
    blast_radius: blastRadius,
    dependency_notes: dependencyNotes,
    routing_artifact_ref: 'docs/incident-ops/cloud-service-topology.md'
  };
}

/**
 * Generates dependency notes explaining service relationships
 * @param {Array} services - Array of service names
 * @param {string} eventType - Primary event type
 * @returns {string} - Human-readable dependency explanation
 */
function generateDependencyNotes(services, eventType) {
  const serviceList = services.join(', ');
  
  if (eventType === 'db_connection_error') {
    return `Database connection exhaustion affecting ${serviceList}. RDS connection pool saturation propagates failures to dependent services. Check connection pool sizing and long-running queries.`;
  }
  
  if (eventType === 'queue_depth_high') {
    return `Queue backlog detected across ${serviceList}. SQS message accumulation indicates downstream processing bottleneck. Consumer scaling may be required.`;
  }
  
  if (eventType === 'job_processing_failed' || eventType === 'job_processing_delayed') {
    return `Job processing failures in ${serviceList}. Lambda execution errors may cascade to queue depth increase. Investigate payload validation and execution timeouts.`;
  }
  
  return `Infrastructure dependency chain affected: ${serviceList}. Cross-service impact detected requiring coordinated investigation.`;
}

/**
 * Generates cloud-service rationale for probable origin
 * @param {object} bucket - Event bucket
 * @param {object} baseOrigin - Base probable origin
 * @returns {object} - Probable origin with cloud-service rationale
 */
function generateCloudServiceRationale(bucket, baseOrigin) {
  if (!isCloudPatternIncident(bucket.events)) {
    return baseOrigin;
  }

  const awsMapping = mapToAwsService(baseOrigin.service);
  const eventType = bucket.events[0]?.type;
  const eventCount = bucket.events.filter(e => e.service === baseOrigin.service).length;

  let cloudRationale = '';
  if (eventType === 'db_connection_error') {
    cloudRationale = `${awsMapping.service} connection pool exhaustion detected. ${eventCount} connection failures from ${baseOrigin.service} indicate ${awsMapping.service} instance under pressure.`;
  } else if (eventType === 'queue_depth_high') {
    cloudRationale = `${awsMapping.service} queue depth threshold exceeded. ${eventCount} depth warnings suggest consumer scaling needed for ${baseOrigin.service}.`;
  } else {
    cloudRationale = `${awsMapping.service} infrastructure issue detected. ${eventCount} events from ${baseOrigin.service} in correlation window.`;
  }

  return {
    ...baseOrigin,
    reason: `${baseOrigin.reason}. Cloud-service analysis: ${cloudRationale}`
  };
}

function promoteIncident(bucket) {
  incidentCounter++;
  const incidentId = `inc_${String(incidentCounter).padStart(3, '0')}`;

  // Determine probable origin (earliest repeated failure)
  const baseProbableOrigin = determineProbableOrigin(bucket.events);

  // Determine severity
  const severity = determineSeverity(bucket);

  // Determine affected components
  const affectedComponents = [...bucket.services];

  // Determine title
  const title = generateTitle(bucket, baseProbableOrigin);

  // Determine runbook
  const runbookRef = determineRunbook(bucket);

  // Generate AWS context for cloud-pattern incidents
  const awsContext = generateAwsContext(bucket, baseProbableOrigin);

  // Enhance probable origin with cloud-service rationale if applicable
  const probableOrigin = generateCloudServiceRationale(bucket, baseProbableOrigin);

  const incident = {
    id: incidentId,
    status: 'open',
    severity,
    title,
    opened_at: new Date().toISOString(),
    promoted_from_event_bucket: bucket.key,
    primary_service: probableOrigin.service,
    affected_components: affectedComponents,
    probable_origin: probableOrigin,
    timeline_ref: '',
    evidence_ref: '',
    summary_ref: '',
    runbook_ref: runbookRef,
    correlated_events: bucket.events.map(e => e.id)
  };

  // Add aws_context only for cloud-pattern incidents
  if (awsContext) {
    incident.aws_context = awsContext;
  }

  return incident;
}

function determineProbableOrigin(events) {
  // Find the service with the earliest repeated failure
  const serviceFirstSeen = {};
  const serviceFailureCount = {};

  for (const event of events) {
    if (event.severity === 'error' || event.severity === 'critical') {
      if (!serviceFirstSeen[event.service]) {
        serviceFirstSeen[event.service] = event.timestamp;
      }
      serviceFailureCount[event.service] = (serviceFailureCount[event.service] || 0) + 1;
    }
  }

  // Pick the service with earliest failure and highest count
  let bestService = null;
  let bestScore = 0;
  let bestTimestamp = null;

  for (const [service, timestamp] of Object.entries(serviceFirstSeen)) {
    const count = serviceFailureCount[service] || 1;
    const score = count * 10 + (bestTimestamp && timestamp < bestTimestamp ? 1 : 0);
    if (score > bestScore || (score === bestScore && timestamp < bestTimestamp)) {
      bestService = service;
      bestScore = score;
      bestTimestamp = timestamp;
    }
  }

  if (!bestService) {
    bestService = events[0]?.service || 'unknown';
  }

  const confidence = Math.min(0.5 + (serviceFailureCount[bestService] || 1) * 0.1, 0.95);

  return {
    service: bestService,
    confidence: Math.round(confidence * 100) / 100,
    reason: `earliest repeated failure in correlation window (${serviceFailureCount[bestService] || 1} events)`
  };
}

function determineSeverity(bucket) {
  if (bucket.severities.has('critical')) return 'P1';
  if (bucket.severities.has('error') && bucket.events.length >= 5) return 'P1';
  if (bucket.severities.has('error')) return 'P2';
  return 'P3';
}

function generateTitle(bucket, probableOrigin) {
  const eventType = bucket.events[0]?.type || 'unknown';
  const service = probableOrigin.service;

  const typeTitles = {
    'job_processing_failed': `${service} repeated job processing failures`,
    'job_processing_delayed': `${service} processing delays causing queue backlog`,
    'db_connection_error': `Database connection exhaustion affecting ${[...bucket.services].join(', ')}`,
    'queue_depth_high': `Queue depth threshold exceeded`,
    'api_started': `Service startup event`,
    'worker_started': `Service startup event`
  };

  return typeTitles[eventType] || `Incident in ${service}: ${eventType}`;
}

function determineRunbook(bucket) {
  const services = [...bucket.services];
  if (services.includes('job-worker') && bucket.events.some(e => e.type === 'job_processing_failed')) {
    return 'runbooks/poison-pill-job.md';
  }
  if (services.includes('queue') || bucket.events.some(e => e.type === 'queue_depth_high')) {
    return 'runbooks/queue-backlog.md';
  }
  if (services.includes('database') || bucket.events.some(e => e.type === 'db_connection_error')) {
    return 'runbooks/db-exhaustion.md';
  }
  return 'runbooks/general-triage.md';
}

module.exports = {
  promoteIncident,
  isCloudPatternIncident,
  mapToAwsService,
  generateAwsContext,
  generateDependencyNotes,
  generateCloudServiceRationale
};

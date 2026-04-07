// intelligence-core/promotion/engine.js
// Incident promotion engine: converts correlated event buckets into actionable incidents

let incidentCounter = 0;

function promoteIncident(bucket) {
  incidentCounter++;
  const incidentId = `inc_${String(incidentCounter).padStart(3, '0')}`;

  // Determine probable origin (earliest repeated failure)
  const probableOrigin = determineProbableOrigin(bucket.events);

  // Determine severity
  const severity = determineSeverity(bucket);

  // Determine affected components
  const affectedComponents = [...bucket.services];

  // Determine title
  const title = generateTitle(bucket, probableOrigin);

  // Determine runbook
  const runbookRef = determineRunbook(bucket);

  return {
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

module.exports = { promoteIncident };

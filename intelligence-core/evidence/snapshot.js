// intelligence-core/evidence/snapshot.js
// Immutable evidence snapshot captured at incident promotion time from shared runtime store

const crypto = require('crypto');
const store = require('../../runtime/store');

function captureEvidence(incident) {
  const allLogs = store.getNewEvents(0);
  const dbStatus = store.getDBStatus();

  const evidence = {
    incident_id: incident.id,
    captured_at: new Date().toISOString(),
    checksum: '',
    scenario_id: store.getScenarioMode() || 'unknown',
    component_health: store.getComponentHealth(),
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
    processed_jobs_count: store.getProcessedJobsCount()
  };

  // Generate checksum for immutability
  const content = JSON.stringify(evidence);
  evidence.checksum = `sha256:${crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)}`;

  return evidence;
}

module.exports = { captureEvidence };

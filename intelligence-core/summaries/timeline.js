// intelligence-core/summaries/timeline.js
// Generates chronological timeline from correlated events

function generateTimeline(bucket, incident) {
  const entries = [];

  // First anomaly
  const firstEvent = bucket.events[0];
  if (firstEvent) {
    entries.push({
      timestamp: firstEvent.timestamp,
      type: 'event',
      service: firstEvent.service,
      severity: firstEvent.severity,
      message: `First anomaly detected: ${firstEvent.message}`,
      event_id: firstEvent.id
    });
  }

  // Correlated events (deduplicated by type+service)
  const seen = new Set();
  for (const event of bucket.events.slice(1)) {
    const key = `${event.type}:${event.service}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({
        timestamp: event.timestamp,
        type: 'event',
        service: event.service,
        severity: event.severity,
        message: event.message,
        event_id: event.id
      });
    }
  }

  // Service state changes
  const services = [...new Set(bucket.events.map(e => e.service))];
  for (const service of services) {
    entries.push({
      timestamp: incident.opened_at,
      type: 'state_change',
      service,
      severity: 'warning',
      message: `${service} marked as affected component`
    });
  }

  // Incident promotion
  entries.push({
    timestamp: incident.opened_at,
    type: 'promotion',
    service: incident.primary_service,
    severity: incident.severity,
    message: `Incident promoted: ${incident.title}`
  });

  // Evidence captured
  entries.push({
    timestamp: incident.opened_at,
    type: 'evidence_captured',
    service: 'intelligence-core',
    severity: 'info',
    message: 'Evidence snapshot captured'
  });

  // Runbook recommended
  entries.push({
    timestamp: incident.opened_at,
    type: 'runbook_recommended',
    service: 'intelligence-core',
    severity: 'info',
    message: `Runbook linked: ${incident.runbook_ref}`
  });

  // Sort by timestamp
  entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return entries;
}

module.exports = { generateTimeline };

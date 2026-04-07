// intelligence-core/summaries/summary.js
// Generates support-friendly incident summary markdown

function generateSummary(incident, evidence, timeline) {
  const lines = [];

  lines.push(`# Incident: ${incident.title}`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| **ID** | ${incident.id} |`);
  lines.push(`| **Severity** | ${incident.severity} |`);
  lines.push(`| **Status** | ${incident.status} |`);
  lines.push(`| **Opened** | ${incident.opened_at} |`);
  lines.push(`| **Primary Service** | ${incident.primary_service} |`);
  lines.push(`| **Affected Components** | ${incident.affected_components.join(', ')} |`);
  lines.push('');

  lines.push('## What Happened');
  lines.push('');
  lines.push(`The intelligence core detected ${incident.correlated_events.length} correlated events`);
  lines.push(`across ${incident.affected_components.length} service(s) within the correlation window.`);
  lines.push(`The probable origin is **${incident.probable_origin.service}**`);
  lines.push(`(${Math.round(incident.probable_origin.confidence * 100)}% confidence): ${incident.probable_origin.reason}`);
  lines.push('');

  lines.push('## Evidence Captured');
  lines.push('');
  lines.push(`- Queue depth at capture: ${evidence.queue_depth}`);
  lines.push(`- Failed jobs: ${evidence.failed_jobs_count}`);
  lines.push(`- Processed jobs: ${evidence.processed_jobs_count}`);
  lines.push(`- DB connections: ${evidence.db_status.active_connections}/${evidence.db_status.max_connections}`);
  lines.push(`- Component health: ${Object.entries(evidence.component_health).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  lines.push('');

  lines.push('## Timeline Highlights');
  lines.push('');
  for (const entry of timeline.slice(0, 8)) {
    lines.push(`- \`${entry.timestamp}\` [${entry.severity.toUpperCase()}] ${entry.service}: ${entry.message}`);
  }
  lines.push('');

  lines.push('## Recommended Next Actions');
  lines.push('');
  lines.push(`1. Review the linked runbook: ${incident.runbook_ref}`);
  lines.push(`2. Inspect the evidence bundle for detailed logs and state`);
  lines.push(`3. Check the affected services for ongoing degradation`);
  lines.push(`4. Escalate to engineering if root cause requires code change`);
  lines.push('');

  lines.push(`**Runbook**: ${incident.runbook_ref}`);

  return lines.join('\n');
}

module.exports = { generateSummary };

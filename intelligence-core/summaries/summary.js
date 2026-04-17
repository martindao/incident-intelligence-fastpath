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

  // AWS-flavored incident context (conditional)
  if (incident.aws_context) {
    lines.push('## AWS-flavored incident context');
    lines.push('');
    lines.push(`**Account**: ${incident.aws_context.account_id}`);
    lines.push(`**Region**: ${incident.aws_context.region}`);
    lines.push(`**Event Type Code**: ${incident.aws_context.event_type_code}`);
    lines.push('');
    lines.push('**Impacted AWS Services**:');
    for (const svc of incident.aws_context.impacted_services) {
      lines.push(`- ${svc.service}: \`${svc.arn}\` (${svc.status})`);
    }
    lines.push('');
  }

  // Cloud dependency analysis during escalation (conditional)
  if (incident.aws_context) {
    lines.push('## Cloud dependency analysis during escalation');
    lines.push('');
    lines.push(incident.aws_context.dependency_notes);
    lines.push('');
    lines.push(`**Routing Artifact**: ${incident.aws_context.routing_artifact_ref}`);
    lines.push('');
  }

  // Blast radius and likely remediation path (conditional)
  if (incident.aws_context && incident.aws_context.blast_radius) {
    lines.push('## Blast radius and likely remediation path');
    lines.push('');
    lines.push('**Affected ARNs**:');
    for (const arn of incident.aws_context.blast_radius) {
      lines.push(`- ${arn}`);
    }
    lines.push('');
    lines.push('**Likely Remediation Path**:');
    lines.push('1. Isolate the primary degraded service to prevent cascade');
    lines.push('2. Scale consumers if queue backlog detected');
    lines.push('3. Review connection pool sizing if RDS exhaustion');
    lines.push('4. Consult routing artifact for service-specific escalation');
    lines.push('');
  }

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

// intelligence-core/correlation/bucket.js
// Dwell-time correlation bucket: groups related events to suppress alert storms

const DWELL_WINDOW_MS = parseInt(process.env.DWELL_WINDOW_MS) || 15000; // 15 seconds
const MAX_BUCKET_SIZE = parseInt(process.env.MAX_BUCKET_SIZE) || 50;
const PROMOTION_THRESHOLD = parseInt(process.env.PROMOTION_THRESHOLD) || 5;

function getBucketKey(event) {
  // For system-level events (queue depth, db errors), use a shared system key
  // so cross-service failures get grouped together
  if (event.correlation_key === 'system' || 
      event.correlation_key === 'queue_system' || 
      event.correlation_key === 'db_shared' ||
      event.type === 'queue_depth_high' ||
      event.type === 'db_connection_error') {
    return `system_incident`;
  }
  // For repeated job processing failures, group by service + event type
  // so multiple different job failures on the same service get correlated
  if (event.type === 'job_processing_failed' || event.type === 'job_processing_delayed') {
    return `service_type:${event.service}:${event.type}`;
  }
  return `${event.correlation_key}:${event.service}`;
}

function correlateEvents(events, activeBuckets) {
  const promoted = {};
  const now = Date.now();

  for (const event of events) {
    const key = getBucketKey(event);

    if (!activeBuckets[key]) {
      activeBuckets[key] = {
        key,
        events: [],
        created_at: now,
        last_event_at: now,
        services: new Set(),
        severities: new Set()
      };
    }

    const bucket = activeBuckets[key];
    bucket.events.push(event);
    bucket.last_event_at = now;
    bucket.services.add(event.service);
    bucket.severities.add(event.severity);

    // Trim oversized buckets
    if (bucket.events.length > MAX_BUCKET_SIZE) {
      bucket.events = bucket.events.slice(-MAX_BUCKET_SIZE);
    }

    // Check promotion rules
    const shouldPromote = checkPromotion(bucket);
    if (shouldPromote) {
      promoted[key] = bucket;
      delete activeBuckets[key];
    }
  }

  // Expire stale buckets
  for (const [key, bucket] of Object.entries(activeBuckets)) {
    if (now - bucket.last_event_at > DWELL_WINDOW_MS * 2) {
      delete activeBuckets[key];
    }
  }

  return { active: activeBuckets, promoted };
}

function checkPromotion(bucket) {
  const eventCount = bucket.events.length;
  const hasCritical = bucket.severities.has('critical');
  const hasError = bucket.severities.has('error');

  // Rule 1: 5+ related failures in dwell window
  if (eventCount >= PROMOTION_THRESHOLD) return true;

  // Rule 2: one critical failure + 1 downstream impact signal
  if (hasCritical && eventCount >= 2) return true;

  // Rule 3: error events from multiple services
  if (hasError && bucket.services.size >= 2 && eventCount >= 3) return true;

  return false;
}

module.exports = { correlateEvents, DWELL_WINDOW_MS, PROMOTION_THRESHOLD };

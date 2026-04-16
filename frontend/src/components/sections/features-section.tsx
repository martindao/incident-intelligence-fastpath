import { Network, Clock, Crosshair, FileArchive, ListTree, BookOpen } from "lucide-react";
import { GlassCard } from "@/components/custom/glass-card";

const FEATURES = [
  {
    icon: Network,
    title: "Event-to-Incident Promotion",
    description: "Raw telemetry events are separated from human-actionable incidents. Only correlated, threshold-crossing failures get promoted.",
  },
  {
    icon: Clock,
    title: "Dwell-Time Correlation Buckets",
    description: "Configurable time window groups related alerts. Tunable per-environment (default 60s window, 5-event minimum).",
  },
  {
    icon: Crosshair,
    title: "Confidence Scoring",
    description: "Probable origin gets a 0.5–0.95 confidence score based on failure count and earliest occurrence. No false certainty.",
  },
  {
    icon: FileArchive,
    title: "4 Auto-Generated Artifacts",
    description: "incident.json, timeline.json, evidence-bundle.json, summary.md — all written to disk per incident, ready for ticket attachment.",
  },
  {
    icon: ListTree,
    title: "Chronological Timeline",
    description: "Every event from first anomaly through promotion is captured with service labels, severity, and timestamps. No log spelunking.",
  },
  {
    icon: BookOpen,
    title: "Runbook Linkage",
    description: "Each incident type auto-links to a specific recovery runbook. Poison pill → poison-pill-job.md, DB exhaustion → db-exhaustion.md.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mb-16 scroll-reveal">
      <div className="glass-card rounded-3xl p-8 sm:p-12">
        <h2 className="section-title text-white relative mb-4 font-display text-3xl sm:text-4xl font-bold">
          Key Features
        </h2>
        <p className="text-lg text-zinc-300 mb-8 max-w-2xl leading-relaxed">
          Built for production incident correlation — dwell-time bucketing, origin analysis, and evidence artifacts.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <GlassCard key={feature.title} delay={i * 0.1}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

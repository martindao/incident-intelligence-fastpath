import { Gauge, Shield, Cog } from "lucide-react";
import { GlassCard } from "@/components/custom/glass-card";

const PROOFS = [
  {
    icon: Gauge,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    title: "Faster MTTD",
    description: "Correlating 50 alerts into 1 incident with probable origin and timeline cuts time-to-diagnosis from hours to minutes.",
    checkmark: "Operational acceleration",
  },
  {
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    title: "Evidence That Survives",
    description: "Immutable snapshots capture state at promotion time. Even if the DB recovers or logs roll over, the evidence bundle is frozen on disk.",
    checkmark: "Audit-ready artifacts",
  },
  {
    icon: Cog,
    color: "text-sky-400",
    bg: "bg-sky-500/20",
    title: "Production-Grade Patterns",
    description: "File-backed runtime store, deterministic test scenarios, exhaustive Bun test coverage. Patterns transfer to any production support stack.",
    checkmark: "Portable architecture",
  },
];

export function ProvesSection() {
  return (
    <section className="mb-16 scroll-reveal">
      <div className="glass-card rounded-3xl p-8 sm:p-12">
        <h2 className="section-title text-white relative mb-4 font-display text-3xl sm:text-4xl font-bold">
          What This Demo Proves
        </h2>
        <p className="text-lg text-zinc-300 mb-8 max-w-2xl leading-relaxed">
          Correlation, evidence, and portability — patterns that transfer to any production support stack.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {PROOFS.map((proof, i) => (
            <GlassCard key={proof.title} delay={i * 0.15}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${proof.bg} flex items-center justify-center`}>
                  <proof.icon className={`w-6 h-6 ${proof.color}`} />
                </div>
                <h4 className="font-semibold text-white text-lg">{proof.title}</h4>
              </div>
              <p className="text-sm text-zinc-400 mb-4">{proof.description}</p>
              <div className={`flex items-center gap-2 ${proof.color} text-sm`}>
                <span>✓</span>
                <span>{proof.checkmark}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

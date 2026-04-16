import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { Layers, Crosshair, Camera, Github, ArrowLeft, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/custom/glass-card";
import { NumberCounter } from "@/components/custom/number-counter";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="mb-16">
      <div className="glass-intense rounded-3xl p-8 sm:p-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -30 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Proof Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30">
                <span className="mr-1.5">⬡</span>Node.js 18+
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                <span className="mr-1.5">🧪</span>Bun Test Suite
              </Badge>
              <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30">
                <span className="mr-1.5">⚡</span>Zero Build Step
              </Badge>
            </div>

            {/* Pain Point Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-cyan font-display leading-tight">
              Alert Storms Should Become One Incident, Not Fifty Tickets
            </h1>

            {/* Subhead */}
            <p className="text-xl text-zinc-300 mb-8 max-w-xl leading-relaxed">
              Production failures generate dozens of duplicate alerts across API, queue, worker, and database. This intelligence core correlates the noise into <em>one</em> actionable incident — with probable origin, evidence snapshot, and linked runbook. Ready for support hand-off in minutes.
            </p>

            {/* Number Ticker Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-400">
                  <NumberCounter value={50} />
                </div>
                <div className="text-sm text-zinc-400 mt-1">alerts correlated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-400">
                  <NumberCounter value={4} />
                </div>
                <div className="text-sm text-zinc-400 mt-1">auto-generated artifacts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-400">
                  <NumberCounter value={95} suffix="%" />
                </div>
                <div className="text-sm text-zinc-400 mt-1">origin confidence</div>
              </div>
            </div>

{/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="./demo/index.html"
          className="cursor-follow-cta inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
        >
          <Play className="w-5 h-5" />
          Open App Demo
        </a>
        <a
          href="https://github.com/martindao/incident-intelligence-fastpath"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/20 text-white font-medium text-base backdrop-blur-xl hover:bg-white/10 hover:scale-105 transition-all duration-300"
        >
          <Github className="w-5 h-5" />
          View on GitHub
        </a>
        <a
          href="../../index.html"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/20 text-white font-medium text-base backdrop-blur-xl hover:bg-white/10 hover:scale-105 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </a>
      </div>
          </motion.div>

          {/* Right: Hero Proof Panel */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, x: 30 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid gap-4"
          >
            <GlassCard delay={0.3}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">Dwell-Time Correlation</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Related events within a time window collapse into one bucket. 50 alert-storm events become 1 incident, not 50 duplicate tickets in the support queue.
              </p>
              <div className="flex items-center gap-2 text-cyan-400 text-xs">
                <span>✓</span>
                <span>Quiets the noise</span>
              </div>
            </GlassCard>

            <GlassCard delay={0.4}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Probable Origin Analysis</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Earliest repeated failure in the correlation window is identified as the probable origin with a confidence score (95% poison pill, 80% DB exhaustion).
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-xs">
                <span>✓</span>
                <span>Skip the guesswork</span>
              </div>
            </GlassCard>

            <GlassCard delay={0.5}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="font-semibold text-white">Immutable Evidence Snapshots</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Queue depth, DB connection pool, recent logs, and failed-job counts are frozen at promotion time. Evidence survives even after the system recovers.
              </p>
              <div className="flex items-center gap-2 text-sky-400 text-xs">
                <span>✓</span>
                <span>Audit-ready artifacts</span>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

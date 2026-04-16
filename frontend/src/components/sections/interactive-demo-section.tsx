import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertFlowChart } from "@/components/custom/alert-flow-chart";
import { ArtifactViewer } from "@/components/custom/artifact-viewer";
import { useSimulation } from "@/hooks/use-simulation";
import { scenarios } from "@/lib/mock-data";
import type { ScenarioId } from "@/lib/types";

const SCENARIOS: { id: ScenarioId; label: string; severity: string; icon: string }[] = [
  { id: "poison-pill", label: "Poison Pill", severity: "P1", icon: "💀" },
  { id: "queue-backlog", label: "Queue Backlog", severity: "P3", icon: "📦" },
  { id: "db-exhaustion", label: "DB Exhaustion", severity: "P2", icon: "🗄️" },
];

export function InteractiveDemoSection() {
  const { state, activeScenario, visibleEvents, start, reset, isRunning } =
    useSimulation();
  const shouldReduceMotion = useReducedMotion();
  const scenario = activeScenario ? scenarios[activeScenario] : null;

  return (
    <section className="mb-16 scroll-reveal">
      <div className="glass-card rounded-3xl p-8 sm:p-12">
        <h2 className="section-title text-white relative mb-4 font-display text-3xl sm:text-4xl font-bold">
          Interactive Demo
        </h2>
        <p className="text-lg text-zinc-300 mb-8 max-w-2xl leading-relaxed">
          Simulate real production incidents and watch the correlation engine in
          action. Click a scenario to see 50 alerts collapse into one actionable
          incident.
        </p>

        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Simulate Scenario
              </h3>
              {SCENARIOS.map((s) => (
                <Button
                  key={s.id}
                  onClick={() => start(s.id)}
                  disabled={isRunning}
                  variant={
                    activeScenario === s.id && state === "complete"
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {s.label}
                  </span>
                  <Badge
                    variant={
                      s.severity === "P1"
                        ? "destructive"
                        : s.severity === "P2"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {s.severity}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* State Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div
                className={`w-2 h-2 rounded-full ${
                  state === "idle"
                    ? "bg-zinc-500"
                    : state === "running"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-green-400"
                }`}
              />
              <span className="text-sm text-zinc-300">
                {state === "idle" && "Ready to simulate"}
                {state === "running" &&
                  `Correlating ${visibleEvents.length} events...`}
                {state === "complete" &&
                  `✓ Incident promoted (${visibleEvents.length} events)`}
              </span>
            </div>

            {/* Reset Button */}
            <Button
              onClick={reset}
              variant="ghost"
              disabled={state === "idle"}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Chart Panel */}
          <div className="lg:col-span-3">
            <AlertFlowChart events={visibleEvents} state={state} />
          </div>
        </div>

        {/* Artifact Viewer - only visible when complete */}
        {state === "complete" && scenario && (
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Generated Artifacts
            </h3>
            <ArtifactViewer scenario={scenario} />
          </motion.div>
        )}
      </div>
    </section>
  );
}

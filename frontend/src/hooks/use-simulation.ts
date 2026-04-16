import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { scenarios } from "@/lib/mock-data";
import type { AlertEvent, ScenarioId, SimulationState } from "@/lib/types";

interface UseSimulationReturn {
  state: SimulationState;
  activeScenario: ScenarioId | null;
  visibleEvents: AlertEvent[];
  start: (scenario: ScenarioId) => void;
  reset: () => void;
  isRunning: boolean;
}

export function useSimulation(): UseSimulationReturn {
  const [state, setState] = useState<SimulationState>("idle");
  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [visibleEvents, setVisibleEvents] = useState<AlertEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(
    (scenarioId: ScenarioId) => {
      if (state === "running") return;

      cleanup();
      const scenario = scenarios[scenarioId];
      setActiveScenario(scenarioId);
      setState("running");
      setVisibleEvents([]);

      const sortedEvents = [...scenario.events].sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      let index = 0;

      timerRef.current = setInterval(() => {
        if (index >= sortedEvents.length) {
          cleanup();
          setState("complete");
          toast.success(`Incident promoted from ${sortedEvents.length} events`, {
            description: scenario.incident.title,
          });
          return;
        }

        const batchSize =
          index < sortedEvents.length - 1
            ? Math.random() > 0.5
              ? 2
              : 1
            : 1;
        const newEvents = sortedEvents.slice(index, index + batchSize);
        setVisibleEvents((prev) => [...prev, ...newEvents]);
        index += batchSize;
      }, 150);
    },
    [state, cleanup],
  );

  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setActiveScenario(null);
    setVisibleEvents([]);
  }, [cleanup]);

  return {
    state,
    activeScenario,
    visibleEvents,
    start,
    reset,
    isRunning: state === "running",
  };
}

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import type { AlertEvent, SimulationState } from "@/lib/types";

const SERVICE_COLORS: Record<string, string> = {
  "api-gateway": "#06b6d4",
  "worker-queue": "#f59e0b",
  "payment-worker": "#8b5cf6",
  database: "#ef4444",
};

const SERVICE_Y_MAP: Record<string, number> = {
  "api-gateway": 4,
  "worker-queue": 3,
  "payment-worker": 2,
  database: 1,
};

interface AlertFlowChartProps {
  events: AlertEvent[];
  state: SimulationState;
}

export function AlertFlowChart({ events, state }: AlertFlowChartProps) {
  const shouldReduceMotion = useReducedMotion();

  const chartData = useMemo(
    () =>
      events.map((e) => ({
        x: e.timestamp / 1000,
        y: SERVICE_Y_MAP[e.service] ?? 0,
        service: e.service,
        fill: SERVICE_COLORS[e.service] ?? "#888",
        severity: e.severity,
      })),
    [events],
  );

  const isComplete = state === "complete";

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={shouldReduceMotion ? {} : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-300">
          {state === "idle" && "Alert Correlation Timeline"}
          {state === "running" && `Correlating ${events.length} events...`}
          {state === "complete" && `✓ 1 Incident Promoted from ${events.length} events`}
        </h3>
        {isComplete && (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30">
            Promoted
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 16]}
            tick={{ fill: "#71717a", fontSize: 11 }}
            label={{
              value: "Time (seconds)",
              position: "insideBottom",
              offset: -5,
              fill: "#71717a",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 5]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(v: number) => {
              const map: Record<number, string> = {
                1: "DB",
                2: "Payment",
                3: "Queue",
                4: "API",
              };
              return map[v] ?? "";
            }}
            tick={{ fill: "#71717a", fontSize: 11 }}
          />
          {isComplete && (
            <ReferenceArea
              x1={0}
              x2={16}
              y1={0}
              y2={5}
              fill="rgba(6, 182, 212, 0.05)"
              stroke="rgba(6, 182, 212, 0.2)"
            />
          )}
          <Scatter
            name="Alerts"
            data={chartData}
            isAnimationActive={false}
            shape={(props: unknown) => {
              const { cx, cy, fill } = props as { cx?: number; cy?: number; fill?: string };
              if (cx == null || cy == null) return <></>;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isComplete ? 2 : 4}
                  fill={fill}
                  opacity={isComplete ? 0.3 : 0.9}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {Object.entries(SERVICE_COLORS).map(([service, color]) => (
          <div key={service} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-zinc-500">{service}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

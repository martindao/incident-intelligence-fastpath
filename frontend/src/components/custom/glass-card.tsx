import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intense?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, intense = false, delay = 0 }: GlassCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={shouldReduceMotion ? {} : { duration: 0.5, delay }}
      className={cn(
        intense ? "glass-intense" : "glass-card",
        "rounded-2xl p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

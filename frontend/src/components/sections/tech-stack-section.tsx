import { Cpu, Code2, Database, Server, FlaskConical, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TECH_ITEMS = [
  { icon: Cpu, label: "Node.js 18+", color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" },
  { icon: Code2, label: "Vanilla JavaScript", color: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
  { icon: Database, label: "File-Backed Store", color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" },
  { icon: Server, label: "Native HTTP", color: "bg-sky-500/10 border-sky-500/20 text-sky-300" },
  { icon: FlaskConical, label: "Bun Test", color: "bg-green-500/10 border-green-500/20 text-green-300" },
  { icon: Terminal, label: "concurrently", color: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
];

export function TechStackSection() {
  return (
    <section className="mb-16 scroll-reveal">
      <div className="glass-card rounded-3xl p-8 sm:p-12">
        <h2 className="section-title text-white relative mb-4 font-display text-3xl sm:text-4xl font-bold">
          Tech Stack
        </h2>
        <p className="text-lg text-zinc-300 mb-8 max-w-2xl leading-relaxed">
          Architectural choice: zero framework lock-in. Every line is readable Node.js — no magic, no abstraction tax.
        </p>

        <div className="flex flex-wrap gap-3">
          {TECH_ITEMS.map((tech) => (
            <Badge key={tech.label} variant="outline" className={`px-4 py-2 text-sm ${tech.color}`}>
              <tech.icon className="w-4 h-4 mr-2" />
              {tech.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

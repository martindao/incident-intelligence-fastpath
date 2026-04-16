import { Github, ArrowLeft, Play } from "lucide-react";

export function FooterCtaSection() {
  return (
    <section className="mb-16">
      <div className="glass-intense rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-cyan-500/10" />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 gradient-text-cyan font-display">
            Read the Source
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Full Node.js implementation — no frameworks, no magic. Every correlation rule, promotion threshold, and confidence score is readable in the source.
          </p>

<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
        </div>
      </div>
    </section>
  );
}

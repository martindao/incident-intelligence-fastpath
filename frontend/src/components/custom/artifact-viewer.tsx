import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Scenario } from "@/lib/types";

interface ArtifactViewerProps {
  scenario: Scenario;
}

const TABS = [
  { key: "incident", label: "incident.json" },
  { key: "timeline", label: "timeline.json" },
  { key: "evidence", label: "evidence-bundle.json" },
  { key: "summary", label: "summary.md" },
] as const;

function JsonBlock({ data }: { data: unknown }) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      Prism.highlightElement(preRef.current);
    }
  }, [data]);

  return (
    <pre
      ref={preRef}
      className="language-json text-xs leading-relaxed"
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ArtifactViewer({ scenario }: ArtifactViewerProps) {
  return (
    <Tabs defaultValue="incident" className="w-full">
      <TabsList className="w-full justify-start bg-zinc-900/50">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="incident" className="mt-4">
        <ScrollArea className="h-[350px] rounded-lg bg-zinc-950/50 border border-zinc-800/50 p-4">
          <JsonBlock data={scenario.incident} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <ScrollArea className="h-[350px] rounded-lg bg-zinc-950/50 border border-zinc-800/50 p-4">
          <JsonBlock data={scenario.timeline} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="evidence" className="mt-4">
        <ScrollArea className="h-[350px] rounded-lg bg-zinc-950/50 border border-zinc-800/50 p-4">
          <JsonBlock data={scenario.evidence} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="summary" className="mt-4">
        <ScrollArea className="h-[350px] rounded-lg bg-zinc-950/50 border border-zinc-800/50 p-4">
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
            {scenario.summaryMd}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

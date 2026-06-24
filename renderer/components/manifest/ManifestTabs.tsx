
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { GraphTab } from "@/components/manifest/GraphTab";
import { RoutesTab } from "@/components/manifest/RoutesTab";
import { ComponentsTab } from "@/components/manifest/ComponentsTab";
import { FlowsTab } from "@/components/manifest/FlowsTab";
import { KnowledgeDocsTab } from "@/components/manifest/KnowledgeDocsTab";
import { RawJsonTab } from "@/components/manifest/RawJsonTab";

const TABS = [
  { value: "graph", label: "Graph", content: <GraphTab /> },
  { value: "routes", label: "Routes", content: <RoutesTab /> },
  { value: "components", label: "Components", content: <ComponentsTab /> },
  { value: "flows", label: "User Flows", content: <FlowsTab /> },
  { value: "knowledge", label: "Knowledge Docs", content: <KnowledgeDocsTab /> },
  { value: "json", label: "Raw JSON", content: <RawJsonTab /> },
];

const triggerClass = cn(
  "h-auto flex-none rounded-lg border border-border bg-transparent px-3.5 py-2 text-xs text-muted-foreground",
  "after:hidden hover:text-foreground",
  "data-active:border-primary/30 data-active:bg-primary/10 data-active:font-bold data-active:text-primary data-active:shadow-none"
);

export function ManifestTabs() {
  return (
    <Tabs defaultValue="graph" className="gap-4">
      <TabsList variant="line" className="h-auto flex-wrap justify-start gap-1.5 p-0">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className={triggerClass}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

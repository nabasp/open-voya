
import { Panel } from "@/components/shared/Panel";
import { BUILD_STATS } from "@/data/mock/buildPipeline.mock";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[22px] font-bold tracking-tight">{value}</div>
      <div className="mt-0.75 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function BuildStatStrip() {
  return (
    <Panel bodyClassName="flex items-center justify-around px-[22px] py-4">
      <Stat value={BUILD_STATS.routes} label="routes found" />
      <div className="h-10 w-px bg-border" />
      <Stat value={BUILD_STATS.targets} label="data-ai-id targets" />
      <div className="h-10 w-px bg-border" />
      <Stat value={BUILD_STATS.docs} label="knowledge docs" />
    </Panel>
  );
}

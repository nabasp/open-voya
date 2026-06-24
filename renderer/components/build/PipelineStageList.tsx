import { CheckCircle2, Loader2, Circle, Pause, RotateCcw } from "lucide-react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, BUILD_STATS } from "@/data/mock/buildPipeline.mock";
import type { PipelineStage } from "@/types";
import { Button } from "@/components/ui/button";

function StageIcon({ state }: { state: PipelineStage["state"] }) {
  if (state === "done") return <CheckCircle2 className="size-4 shrink-0 text-success" />;
  if (state === "active")
    return <Loader2 className="size-4 shrink-0 animate-spin text-warning" />;
  return <Circle className="size-4 shrink-0 text-[#c7c2b6]" />;
}

export function PipelineStageList() {
  return (
    <Panel className="flex h-full flex-col">
      <div className="flex justify-between">
      <PanelLabel className="mb-4">Pipeline</PanelLabel>
      <div className="flex gap-1">
        <Button variant="outline" size="icon">
          <Pause/>
        </Button>
        <Button variant="outline" size="icon">
          <RotateCcw/>
        </Button>
      </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2.75 px-0.5 py-2">
            <StageIcon state={stage.state} />
            <span
              className={cn(
                "text-[12.5px]",
                stage.state === "active"
                  ? "font-bold text-foreground"
                  : stage.state === "done"
                    ? "text-foreground"
                    : "text-[#9a9890]"
              )}
            >
              {stage.label}
            </span>
            <span className="ml-auto text-[11px] text-[#9a9890]">{stage.time}</span>
          </div>
        ))}
      </div>

      <Separator className="my-3.5" />

      <div className="mb-2 flex justify-between text-xs">
        <span className="text-muted-foreground">Overall</span>
        <span className="font-bold">{BUILD_STATS.overall}%</span>
      </div>
      <Progress value={BUILD_STATS.overall} className="h-2 bg-[#ddd9cf]" />
    </Panel>
  );
}

import { CheckCircle2, Loader2, Circle, XCircle, Pause, RotateCcw } from "lucide-react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, BUILD_STATS } from "@/data/mock/buildPipeline.mock";

export interface StageRow {
  id?: string;
  label: string;
  time?: string;
  state: "done" | "active" | "pending" | "failed";
}

function StageIcon({ state }: { state: StageRow["state"] }) {
  if (state === "done") return <CheckCircle2 className="size-4 shrink-0 text-success" />;
  if (state === "active")
    return <Loader2 className="size-4 shrink-0 animate-spin text-warning" />;
  if (state === "failed") return <XCircle className="size-4 shrink-0 text-error" />;
  return <Circle className="size-4 shrink-0 text-[#c7c2b6]" />;
}

export function PipelineStageList({
  stages,
  overall,
  selectedId,
  onSelectStage,
}: {
  stages?: StageRow[];
  overall?: number;
  selectedId?: string;
  onSelectStage?: (id: string) => void;
}) {
  const rows: StageRow[] = stages ?? PIPELINE_STAGES;
  const pct = overall ?? BUILD_STATS.overall;
  const selectable = Boolean(onSelectStage);

  return (
    <Panel className="flex h-full flex-col">
      <div className="flex justify-between">
        <PanelLabel className="mb-4">Pipeline</PanelLabel>
        <div className="flex gap-1">
          <Button variant="outline" size="icon">
            <Pause />
          </Button>
          <Button variant="outline" size="icon">
            <RotateCcw />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((stage) => {
          const selected = Boolean(stage.id) && stage.id === selectedId;
          const interactive = selectable && Boolean(stage.id);
          return (
            <button
              key={stage.id ?? stage.label}
              type="button"
              disabled={!interactive}
              onClick={interactive ? () => onSelectStage!(stage.id!) : undefined}
              className={cn(
                "flex items-center gap-2.75 rounded-lg px-2 py-2 text-left transition-colors",
                interactive && "cursor-pointer hover:bg-accent",
                selected && "bg-primary/10 hover:bg-primary/10",
                !interactive && "cursor-default"
              )}
            >
              <StageIcon state={stage.state} />
              <span
                className={cn(
                  "text-[12.5px]",
                  selected
                    ? "font-bold text-primary"
                    : stage.state === "active"
                      ? "font-bold text-foreground"
                      : stage.state === "done"
                        ? "text-foreground"
                        : stage.state === "failed"
                          ? "text-error"
                          : "text-[#9a9890]"
                )}
              >
                {stage.label}
              </span>
              <span className="ml-auto text-[11px] text-[#9a9890]">{stage.time}</span>
            </button>
          );
        })}
      </div>

      <Separator className="my-3.5" />

      <div className="mb-2 flex justify-between text-xs">
        <span className="text-muted-foreground">Overall</span>
        <span className="font-bold">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2 bg-[#ddd9cf]" />
    </Panel>
  );
}

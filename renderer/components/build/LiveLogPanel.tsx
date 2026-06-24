import { useEffect, useRef } from "react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BUILD_LOG } from "@/data/mock/buildLog.mock";

export interface LogRow {
  text: string;
  kind: "accent" | "muted" | "error" | "warning";
}

export function LiveLogPanel({
  lines,
  emptyText = "Waiting for output…",
}: {
  lines?: LogRow[];
  emptyText?: string;
}) {
  const rows: LogRow[] = lines ?? BUILD_LOG;
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the viewport to the newest line as logs stream in.
  useEffect(() => {
    const viewport = endRef.current?.parentElement;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [rows.length]);

  return (
    <Panel className="flex h-full flex-col">
      <PanelLabel className="mb-4">Live log</PanelLabel>
      <ScrollArea className="h-90 flex-1 rounded-lg border border-[#c7c2b6] bg-surface-inset">
        <div className="p-3.5 text-[11.5px] leading-[1.75]">
          {rows.map((line, i) => (
            <div
              key={i}
              className={cn(
                line.kind === "accent" && "font-bold text-primary",
                line.kind === "error" && "font-bold text-error",
                line.kind === "warning" && "text-warning",
                line.kind === "muted" && "text-[#52514a]"
              )}
            >
              {line.text}
            </div>
          ))}
          {rows.length === 0 && <div className="text-[#9a9890]">{emptyText}</div>}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </Panel>
  );
}

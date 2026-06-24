
import { Panel, PanelLabel } from "@/components/shared/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BUILD_LOG } from "@/data/mock/buildLog.mock";

export function LiveLogPanel() {
  return (
    <Panel className="flex h-full flex-col">
      <PanelLabel className="mb-4">Live log</PanelLabel>
      <ScrollArea className="h-90 flex-1 rounded-lg border border-[#c7c2b6] bg-surface-inset">
        <div className="p-3.5 text-[11.5px] leading-[1.75]">
          {BUILD_LOG.map((line, i) => (
            <div
              key={i}
              className={cn(
                line.kind === "accent" ? "font-bold text-primary" : "text-[#52514a]"
              )}
            >
              {line.text}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Panel>
  );
}

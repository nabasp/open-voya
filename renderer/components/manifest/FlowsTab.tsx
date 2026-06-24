
import { Panel } from "@/components/shared/Panel";
import { FLOWS } from "@/data/mock/manifestFlows.mock";

export function FlowsTab() {
  return (
    <div className="flex flex-col gap-3.5">
      {FLOWS.map((flow) => (
        <Panel key={flow.name} bodyClassName="px-5 py-[18px]">
          <div className="mb-3.5 text-[13.5px] font-bold">{flow.name}</div>
          <div className="flex flex-wrap items-center gap-2.5">
            {flow.steps.map((step, i) => (
              <span key={i} className="inline-flex items-center gap-2.5">
                <span className="rounded-full border border-[#cbc8bd] bg-surface px-3.5 py-1.75 text-xs font-bold">
                  {step}
                </span>
                {i < flow.steps.length - 1 && (
                  <span className="font-bold text-primary">→</span>
                )}
              </span>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

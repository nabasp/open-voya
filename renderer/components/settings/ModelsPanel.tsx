import { Plus } from "lucide-react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { INSTALLED_MODELS } from "@/data/mock/settings.mock";

export function ModelsPanel() {
  return (
    <Panel bodyClassName="p-6">
      <PanelLabel className="mb-4">Installed</PanelLabel>
      <div className="flex flex-col gap-2.5">
        {INSTALLED_MODELS.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-3.5"
          >
            <span className="flex-1 text-[12.5px] font-bold">{m.name}</span>
            <span className="text-[11.5px] text-[#9a9890]">{m.size}</span>
            {m.isDefault && (
              <span className="rounded-full bg-[#14130f] px-2.5 py-0.75 text-[10px] tracking-wide text-[#f3f1ea] uppercase">
                Default
              </span>
            )}
            <button className="text-[11.5px] font-bold text-error">Delete</button>
          </div>
        ))}
      </div>
      <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#cbc8bd] px-4 py-2.5 text-xs font-bold transition-colors hover:border-primary">
        <Plus className="size-3.5" />
        Download model
      </button>
    </Panel>
  );
}

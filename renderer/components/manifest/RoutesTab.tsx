import * as React from "react";

import { PanelLabel } from "@/components/shared/Panel";
import { cn } from "@/lib/utils";
import { ROUTES, DEFAULT_SELECTED_ROUTE } from "@/data/mock/manifestRoutes.mock";

// Static detail column (mirrors the design — fixed sample selection).
const DETAIL_FIELDS = [
  { label: "data-ai-id", value: "button-billing-0" },
  { label: "Component", value: "BillingButton" },
  { label: "Props", value: "variant, onClick" },
  { label: "Source file", value: "src/pages/Billing.tsx" },
];

export function RoutesTab() {
  const [selected, setSelected] = React.useState(DEFAULT_SELECTED_ROUTE);
  const route = ROUTES.find((r) => r.path === selected) ?? ROUTES[1];

  return (
    <div className="grid h-130 grid-cols-[200px_1fr_280px] overflow-hidden rounded-xl border border-border bg-card">
      {/* route list */}
      <div className="overflow-y-auto border-r border-border p-2.5">
        {ROUTES.map((r) => {
          const active = r.path === selected;
          return (
            <button
              key={r.path}
              onClick={() => setSelected(r.path)}
              className={cn(
                "mb-0.75 block w-full rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
                active
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-[#52514a] hover:bg-accent"
              )}
            >
              {r.path}
            </button>
          );
        })}
      </div>

      {/* components on route */}
      <div className="overflow-y-auto border-r border-border p-4">
        <PanelLabel className="mb-3.5">Components on {selected}</PanelLabel>
        <div className="flex flex-col gap-2.5">
          {route.components.map((c) => (
            <div key={c.aiId} className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <div className="text-[13px] font-bold">{c.name}</div>
              <div className="mt-1 text-[11px] text-primary">{c.aiId}</div>
            </div>
          ))}
        </div>
      </div>

      {/* detail */}
      <div className="overflow-y-auto p-4">
        <PanelLabel className="mb-3.5">Detail</PanelLabel>
        <div className="flex flex-col gap-2.5">
          {DETAIL_FIELDS.map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="text-[9.5px] tracking-[0.6px] text-muted-foreground uppercase">
                {f.label}
              </div>
              <div className="mt-1 text-[12.5px] font-bold break-all">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

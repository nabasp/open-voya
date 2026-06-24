import { ShieldCheck } from "lucide-react";

import { Panel } from "@/components/shared/Panel";
import { Separator } from "@/components/ui/separator";

export function PrivacyPanel() {
  return (
    <Panel bodyClassName="flex flex-col gap-[18px] p-6">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="size-5 shrink-0 text-success" />
        <div>
          <div className="text-[13px] font-bold">
            Zero external network calls at runtime
          </div>
          <div className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            All inference, retrieval and embedding happens on-device via llama.cpp +
            LanceDB. The exported SDK ships with 0 runtime dependencies on external
            services.
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold">Network access</div>
        <span className="rounded-full border border-success/40 px-2.5 py-0.75 text-[11px] text-success">
          Blocked at runtime
        </span>
      </div>
    </Panel>
  );
}

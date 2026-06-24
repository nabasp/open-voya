import { AlertTriangle } from "lucide-react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { CopyButton } from "@/components/shared/CopyButton";

const INSTALL_SNIPPET = `npm install ./generated/site-agent

import { SiteAgent } from '@billing-app/site-agent';
<BrowserRouter>
  <YourApp />
  <SiteAgent position="bottom-right" />
</BrowserRouter>`;

export function InstallInstructions() {
  return (
    <>
      <Panel bodyClassName="p-[22px]">
        <div className="mb-3.5 flex items-center justify-between">
          <PanelLabel>Install instructions</PanelLabel>
          <CopyButton text={INSTALL_SNIPPET} />
        </div>
        <pre className="m-0 overflow-auto rounded-lg border border-[#c7c2b6] bg-surface-inset p-3.75 font-mono text-[11px] leading-[1.7] whitespace-pre-wrap text-[#3a3933]">
          {INSTALL_SNIPPET}
        </pre>
      </Panel>

      <div className="flex items-start gap-2.5 rounded-xl border border-error/40 bg-error/[0.07] px-4 py-3.5">
        <AlertTriangle className="mt-px size-4.25 shrink-0 text-error" />
        <div className="text-[11.5px] leading-relaxed text-[#9a4a3e]">
          Requires <b>react-router-dom ^6.0.0</b> — navigate actions will throw
          without a Router provider.
        </div>
      </div>
    </>
  );
}

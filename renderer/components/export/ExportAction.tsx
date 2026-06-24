import * as React from "react";
import { Download } from "lucide-react";

import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/CopyButton";
import { FrogLogo } from "@/components/shared/FrogLogo";

const EXPORT_PATH = "~/projects/billing-app/generated/site-agent";

export function ExportAction() {
  // Local UI-only toggle to preview the success state — nothing is generated.
  const [done, setDone] = React.useState(false);

  if (done) {
    return (
      <Panel bodyClassName="flex flex-col gap-3.5 p-5">
        <div className="inline-flex items-center gap-2.5 self-start rounded-lg bg-[#16150f] px-4 py-2.5 text-[13px] font-bold text-[#f3f1ea]">
          <FrogLogo size={19} variant="light" />
          AI Ready
        </div>
        <div className="text-[11.5px] break-all text-[#52514a] select-all">
          {EXPORT_PATH}
        </div>
        <Button variant="outline" className="self-start">
          Reveal in Finder
        </Button>
      </Panel>
    );
  }

  return (
    <div className="flex justify-end gap-3">
      <CopyButton
        text="npm install ./generated/site-agent"
        label="Copy command"
        className="px-4 py-3 text-[12.5px]"
      />
      <Button
        onClick={() => setDone(true)}
        className="h-auto bg-primary px-6.5 py-3 text-sm text-white hover:bg-[#c40711]"
      >
        Export package
        <Download />
      </Button>
    </div>
  );
}

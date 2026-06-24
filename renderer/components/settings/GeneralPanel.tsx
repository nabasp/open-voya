import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { STORAGE_PATH } from "@/data/mock/settings.mock";

function InlineRadios({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <RadioGroup defaultValue={defaultValue} className="flex w-fit flex-row gap-4.5">
      {options.map((opt) => (
        <Label
          key={opt}
          htmlFor={`${name}-${opt}`}
          className="cursor-pointer gap-2 text-[12.5px] font-normal"
        >
          <RadioGroupItem value={opt} id={`${name}-${opt}`} />
          {opt}
        </Label>
      ))}
    </RadioGroup>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[13px] font-bold">{title}</div>
      {children}
    </div>
  );
}

export function GeneralPanel() {
  return (
    <Panel bodyClassName="flex flex-col gap-[22px] p-6">
      <Row title="Theme">
        <InlineRadios name="theme" options={["Light", "Dark", "Auto"]} defaultValue="Light" />
      </Row>
      <Separator />

      <Row title="Auto-update">
        <div className="flex items-center gap-2 rounded-lg border border-[#cbc8bd] bg-surface px-3.5 py-2 text-xs">
          On <ChevronDown className="size-3 text-muted-foreground" />
        </div>
      </Row>
      <Separator />

      <Row title="Telemetry">
        <div>
          <InlineRadios
            name="telemetry"
            options={["Disabled", "Enabled"]}
            defaultValue="Disabled"
          />
          <div className="mt-2.5 max-w-60 text-[11px] leading-relaxed text-[#9a9890]">
            No data is ever sent. All inference is local.
          </div>
        </div>
      </Row>
      <Separator />

      <Row title="Storage path">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#52514a]">{STORAGE_PATH}</span>
          <Button variant="outline" size="sm">
            Change
          </Button>
        </div>
      </Row>
    </Panel>
  );
}

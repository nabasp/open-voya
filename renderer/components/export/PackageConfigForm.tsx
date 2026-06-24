import * as React from "react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RadioField({
  label,
  options,
  defaultValue,
  name,
}: {
  label: string;
  options: string[];
  defaultValue: string;
  name: string;
}) {
  return (
    <Field label={label}>
      <RadioGroup defaultValue={defaultValue} className="gap-2">
        {options.map((opt) => (
          <Label
            key={opt}
            htmlFor={`${name}-${opt}`}
            className="cursor-pointer gap-2.5 text-[12.5px] font-normal text-foreground"
          >
            <RadioGroupItem value={opt} id={`${name}-${opt}`} />
            {opt}
          </Label>
        ))}
      </RadioGroup>
    </Field>
  );
}

export function PackageConfigForm() {
  return (
    <Panel bodyClassName="p-[22px]">
      <PanelLabel className="mb-4.5">Package configuration</PanelLabel>

      <div className="mb-4.5 grid grid-cols-[1fr_100px] gap-3">
        <Field label="Package name">
          <Input defaultValue="@billing-app/site-agent" className="bg-[#faf8f3] text-xs" />
        </Field>
        <Field label="Version">
          <Input defaultValue="1.0.0" className="bg-[#faf8f3] text-xs" />
        </Field>
      </div>

      <div className="mb-4.5">
        <RadioField
          name="mode"
          label="Mode"
          defaultValue="production"
          options={["production", "dev (mock LLM + debug panel)"]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4.5">
        <RadioField
          name="position"
          label="Position"
          defaultValue="bottom-right"
          options={["bottom-right", "bottom-left"]}
        />
        <RadioField
          name="theme"
          label="Theme"
          defaultValue="auto"
          options={["auto", "light", "dark"]}
        />
      </div>
    </Panel>
  );
}

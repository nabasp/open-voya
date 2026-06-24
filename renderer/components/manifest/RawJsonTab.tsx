
import { Panel } from "@/components/shared/Panel";
import { CopyButton } from "@/components/shared/CopyButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RAW_MANIFEST_JSON } from "@/data/mock/rawManifest.mock";

export function RawJsonTab() {
  return (
    <Panel bodyClassName="relative p-4">
      <div className="absolute top-4 right-4 z-2">
        <CopyButton text={RAW_MANIFEST_JSON} />
      </div>
      <ScrollArea className="h-125 rounded-lg border border-[#c7c2b6] bg-surface-inset">
        <pre className="m-0 p-4.5 font-mono text-[11.5px] leading-[1.7] whitespace-pre text-[#3a3933]">
          {RAW_MANIFEST_JSON}
        </pre>
      </ScrollArea>
    </Panel>
  );
}

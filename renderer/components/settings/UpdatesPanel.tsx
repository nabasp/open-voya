
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { APP_VERSION } from "@/data/mock/settings.mock";

export function UpdatesPanel() {
  return (
    <Panel bodyClassName="p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold">open voya</div>
          <div className="mt-0.75 text-[11.5px] text-[#9a9890]">
            v{APP_VERSION} · up to date
          </div>
        </div>
        <Button className="bg-[#14130f] text-[#f3f1ea] hover:bg-black">
          Check for updates
        </Button>
      </div>
    </Panel>
  );
}

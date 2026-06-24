import * as React from "react";
import { useRouter } from "next/router";
import { Folder } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ImportSource = "git" | "local";

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [source, setSource] = React.useState<ImportSource>("git");

  const startBuild = () => {
    onOpenChange(false);
    router.push("/project/build");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="gap-0 p-0 sm:max-w-120">
        <DialogHeader className="border-b px-5.5 py-4.5">
          <DialogTitle className="text-[15px] tracking-tight">
            Import project
          </DialogTitle>
        </DialogHeader>

        <div className="px-5.5 py-5.5">
          {/* source segmented control */}
          <ToggleGroup
            type="single"
            value={source}
            onValueChange={(v) => v && setSource(v as ImportSource)}
            spacing={0}
            className="mb-4 w-full rounded-lg border border-border bg-chrome p-0.75"
          >
            <ToggleGroupItem
              value="git"
              variant="default"
              className="flex-1 rounded-md text-xs data-checked:bg-surface data-checked:font-bold data-checked:shadow-sm"
            >
              Git URL
            </ToggleGroupItem>
            <ToggleGroupItem
              value="local"
              variant="default"
              className="flex-1 rounded-md text-xs data-checked:bg-surface data-checked:font-bold data-checked:shadow-sm"
            >
              Local folder
            </ToggleGroupItem>
          </ToggleGroup>

          {source === "git" ? (
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Git repository URL
              </Label>
              <Input
                defaultValue="https://github.com/acme/billing-app"
                className="bg-[#faf8f3] text-[12.5px]"
              />
            </div>
          ) : (
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Project folder
              </Label>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-[#faf8f3] px-3 py-2.5 text-left text-[12.5px] transition-colors hover:border-primary"
              >
                <Folder className="size-4.25 shrink-0 text-muted-foreground" />
                <span className="text-[#9a9890]">No folder selected</span>
                <span className="ml-auto text-[11px] font-bold text-muted-foreground">
                  Browse…
                </span>
              </button>
            </div>
          )}

          <Label className="mt-4.5 mb-1.5 text-xs text-muted-foreground">
            Project name
          </Label>
          <Input defaultValue="billing-app" className="bg-[#faf8f3] text-[12.5px]" />
        </div>
        <DialogFooter className="border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={startBuild}
            className="bg-[#14130f] text-[#f3f1ea] hover:bg-black"
          >
            Start build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Plus } from "lucide-react";

import { useImportDialog } from "@/components/layout/AppLayout";

export function NewProjectCard() {
  const { openImport } = useImportDialog();

  return (
    <button
      type="button"
      onClick={openImport}
      className="group flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbc8bd] p-5 text-center text-foreground transition-colors hover:border-primary hover:bg-[#faf8f3]"
    >
      <div className="mb-3.5 flex size-10.5 items-center justify-center rounded-[10px] bg-accent">
        <Plus className="size-5" />
      </div>
      <div className="text-sm font-bold">New Project</div>
      <div className="mt-1.75 max-w-42.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Paste a Git URL to clone, analyze and build an agent.
      </div>
      <span className="mt-4 rounded-lg border border-[#cbc8bd] px-3.5 py-2 text-[11.5px] font-bold">
        Import repo
      </span>
    </button>
  );
}

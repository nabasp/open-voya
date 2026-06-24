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
import { projectIpc } from "@/lib/ipc";
import type { ImportRequest } from "@/lib/ipc";
import {
  VALID_NAME,
  deriveNameFromFolder,
  deriveNameFromGitUrl,
} from "@/lib/projectName";

type ImportSource = "git" | "local";

/**
 * Renders a folder path that shrinks within its row, keeping the trailing
 * folder name fully visible (head truncates with a leading-ish ellipsis).
 */
function FolderPath({ path }: { path: string }) {
  if (!path) {
    return (
      <span className="min-w-0 flex-1 truncate text-[#9a9890]">
        No folder selected
      </span>
    );
  }
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const head = idx >= 0 ? path.slice(0, idx + 1) : "";
  const tail = idx >= 0 ? path.slice(idx + 1) : path;
  return (
    <span className="flex min-w-0 flex-1 text-foreground" title={path}>
      <span className="truncate">{head}</span>
      <span className="shrink-0">{tail}</span>
    </span>
  );
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [source, setSource] = React.useState<ImportSource>("git");
  const [gitUrl, setGitUrl] = React.useState("");
  const [localPath, setLocalPath] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  // Tracks whether the current name was auto-generated (vs. user-edited).
  const [nameAutoFilled, setNameAutoFilled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Reset the form whenever the dialog is (re)opened.
  React.useEffect(() => {
    if (open) {
      setSource("git");
      setGitUrl("");
      setLocalPath("");
      setProjectName("");
      setNameAutoFilled(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // When the source (URL/folder) changes, (re)derive the project name.
  const onGitUrlChange = (value: string) => {
    setGitUrl(value);
    setProjectName(deriveNameFromGitUrl(value));
    setNameAutoFilled(true);
  };

  const browse = async () => {
    if (!projectIpc.available()) return;
    const { path } = await projectIpc.pickFolder();
    if (path) {
      setLocalPath(path);
      setProjectName(deriveNameFromFolder(path));
      setNameAutoFilled(true);
    }
  };

  const onNameChange = (value: string) => {
    setProjectName(value);
    setNameAutoFilled(false);
  };

  const trimmedName = projectName.trim();
  const nameInvalid = trimmedName !== "" && !VALID_NAME.test(trimmedName);
  const canSubmit = trimmedName !== "" && !nameInvalid && !submitting;

  const startBuild = async () => {
    setError(null);

    // Without the preload bridge (e.g. plain browser), just navigate for demo.
    if (!projectIpc.available()) {
      onOpenChange(false);
      router.push("/project/build");
      return;
    }

    const req: ImportRequest = {
      sourceType: source,
      projectName: trimmedName,
      gitUrl: source === "git" ? gitUrl.trim() : undefined,
      localPath: source === "local" ? localPath.trim() : undefined,
    };

    setSubmitting(true);
    try {
      const { projectId } = await projectIpc.start(req);
      onOpenChange(false);
      router.push(`/project/build?projectId=${encodeURIComponent(projectId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="gap-0 p-0 sm:max-w-120">
        <DialogHeader className="border-b px-5.5 py-4.5">
          <DialogTitle className="text-[15px] tracking-tight">
            Import project
          </DialogTitle>
        </DialogHeader>

        <div className="min-w-0 px-5.5 py-5.5">
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
                value={gitUrl}
                onChange={(e) => onGitUrlChange(e.target.value)}
                placeholder="https://github.com/user/project.git"
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
                onClick={browse}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-[#faf8f3] px-3 py-2.5 text-left text-[12.5px] transition-colors hover:border-primary"
              >
                <Folder className="size-4.25 shrink-0 text-muted-foreground" />
                <FolderPath path={localPath} />
                <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                  Browse…
                </span>
              </button>
            </div>
          )}

          <Label className="mt-4.5 mb-1.5 text-xs text-muted-foreground">
            Project name
          </Label>
          <Input
            value={projectName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="my-project"
            aria-invalid={nameInvalid}
            className="bg-[#faf8f3] text-[12.5px]"
          />
          {nameInvalid ? (
            <div className="mt-1.5 text-[11px] text-error">
              Use only letters, numbers, dot, dash or underscore.
            </div>
          ) : (
            nameAutoFilled &&
            trimmedName !== "" && (
              <div className="mt-1.5 text-[11px] text-[#9a9890]">
                Project name automatically generated from repository/folder name.
              </div>
            )
          )}

          {error && (
            <div className="mt-3.5 rounded-lg border border-error/30 bg-error/[0.07] px-3 py-2.5 text-[11.5px] text-error">
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="m-0 px-5.5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={startBuild}
            disabled={!canSubmit}
            className="bg-[#14130f] text-[#f3f1ea] hover:bg-black"
          >
            {submitting ? "Starting…" : "Start build"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

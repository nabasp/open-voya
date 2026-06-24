
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const STATUS_META: Record<
  ProjectStatus,
  { label: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  ready: {
    label: "Ready",
    text: "text-success",
    border: "border-success/40",
    dot: "bg-success",
  },
  generating: {
    label: "Generating",
    text: "text-warning",
    border: "border-warning/45",
    dot: "bg-warning",
    pulse: true,
  },
  error: {
    label: "Error",
    text: "text-error",
    border: "border-error/45",
    dot: "bg-error",
  },
};

/**
 * Ready / Generating / Error pill — composes the shadcn `Badge` (outline
 * variant) with the design's status colors + a leading status dot.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 bg-transparent tracking-wide", meta.text, meta.border, className)}
    >
      <span
        className={cn("size-1.5 rounded-full", meta.dot, meta.pulse && "animate-pulse")}
      />
      {meta.label}
    </Badge>
  );
}

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Uppercase section eyebrow used throughout the panels ("PIPELINE", "DETAIL"…). */
export function PanelLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-[10.5px] tracking-[1.5px] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  );
}

/**
 * The recurring surface panel (bg-card, 1px border, rounded-xl). Thin wrapper
 * over the shadcn Card so every screen shares one definition.
 */
export function Panel({
  className,
  bodyClassName,
  children,
  ...props
}: React.ComponentProps<typeof Card> & { bodyClassName?: string }) {
  return (
    <Card
      className={cn("gap-0 rounded-xl border border-border py-0 ring-0", className)}
      {...props}
    >
      <CardContent className={cn("p-5", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}

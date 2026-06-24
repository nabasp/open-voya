import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = () => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard unavailable — still show the visual confirmation */
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onCopy}
      className={cn("bg-surface text-[11px]", className)}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

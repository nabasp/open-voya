import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  placeholder = "Search projects...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.75 -translate-y-1/2 text-[#9a9890]" />
      <Input
        placeholder={placeholder}
        className="h-auto rounded-lg bg-[#faf8f3] py-2.5 pr-3.5 pl-9.5 text-[12.5px]"
      />
    </div>
  );
}


import { FrogLogo } from "@/components/shared/FrogLogo";

export function TitleBar() {
  return (
    <div className="flex h-9 shrink-0 select-none items-center justify-between border-b border-[#d7d4c9] bg-chrome px-3">
      <div className="flex items-center gap-2.5">
        <FrogLogo size={21} />
        <span className="text-[12.5px] font-bold tracking-tight">open voya</span>
        <span className="ml-1 text-[11px] text-[#9a9890]">
          — AI Website Agent Builder
        </span>
      </div>
    </div>
  );
}

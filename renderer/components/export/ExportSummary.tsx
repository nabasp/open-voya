import { CheckCircle2 } from "lucide-react";

export function ExportSummary() {
  return (
    <div className="mb-4.5 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/8 px-4.5 py-3.5">
      <CheckCircle2 className="mt-px size-4.5 shrink-0 text-success" />
      <div className="text-[12.5px] leading-relaxed">
        <b>SDK built · qwen2.5-3b · GGUF Q4_K_M</b>
        <br />
        <span className="text-[#52514a]">
          89 data-ai-id targets · 0 external dependencies at runtime
        </span>
      </div>
    </div>
  );
}

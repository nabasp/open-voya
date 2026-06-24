
import { STATUS_DOT } from "@/styles/theme";
import {
  ACTIVE_MODEL,
  APP_VERSION,
  LANCEDB_DOC_COUNT,
} from "@/data/mock/settings.mock";

function Dot() {
  return <span style={{ color: "#c7c2b6" }}>·</span>;
}

export function StatusBar() {
  return (
    <div className="flex h-7 shrink-0 items-center gap-3.5 border-t border-[#d7d4c9] bg-chrome px-4 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span
          className="size-1.75 rounded-full"
          style={{ background: STATUS_DOT.online }}
        />
        llama.cpp ready
      </span>
      <Dot />
      <span>{ACTIVE_MODEL}</span>
      <Dot />
      <span>LanceDB: {LANCEDB_DOC_COUNT} docs</span>
      <span className="ml-auto text-[#9a9890]">v{APP_VERSION}</span>
    </div>
  );
}

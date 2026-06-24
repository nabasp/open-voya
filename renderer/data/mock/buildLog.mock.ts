import type { LogLine } from "@/types";

// Static live-log contents (design FULL_LOG). "accent" = command, "muted" = output.
export const BUILD_LOG: LogLine[] = [
  { text: "> git clone github.com/acme/billing-app", kind: "accent" },
  { text: "  cloned 1,204 objects", kind: "muted" },
  { text: "> ts-morph: parsing src/**/*.tsx", kind: "accent" },
  { text: "  Found 12 routes", kind: "muted" },
  { text: "  Parsing Billing.tsx", kind: "muted" },
  { text: "> GitNexus: building dependency graph", kind: "accent" },
  { text: "> Injecting data-ai-id attributes…", kind: "accent" },
  { text: "  button-billing-0", kind: "muted" },
  { text: "  nav-link-settings-0", kind: "muted" },
  { text: "  export-btn-0", kind: "muted" },
  { text: "  invoice-row-0", kind: "muted" },
  { text: "> Generating knowledge docs", kind: "accent" },
  { text: "  142 docs created", kind: "muted" },
  { text: "> Embedding with bge-small-en-v1.5", kind: "accent" },
  { text: "> Storing vectors in LanceDB", kind: "accent" },
  { text: "> Bundling SDK with Vite", kind: "accent" },
  { text: "  ✓ ./generated/site-agent", kind: "muted" },
];

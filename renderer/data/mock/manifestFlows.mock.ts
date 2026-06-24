import type { Flow } from "@/types";

export const FLOWS: Flow[] = [
  { name: "Upgrade plan", steps: ["/settings", "/billing", "/checkout"] },
  { name: "Create invoice", steps: ["/billing", "Create invoice modal", "/billing"] },
  { name: "Export data", steps: ["/billing", "exportData()", "download"] },
];

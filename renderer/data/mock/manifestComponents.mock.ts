import type { ComponentRow } from "@/types";

export const COMPONENTS: ComponentRow[] = [
  { name: "NavBar", aiId: "nav-bar-0", props: "—" },
  { name: "BillingButton", aiId: "button-billing-0", props: "variant, onClick" },
  { name: "ExportButton", aiId: "export-btn-0", props: "format" },
  { name: "InvoiceTable", aiId: "invoice-table-0", props: "rows" },
  { name: "PlanCard", aiId: "plan-card-0", props: "tier" },
  { name: "CreateInvoiceModal", aiId: "invoice-modal-0", props: "open, onClose" },
];

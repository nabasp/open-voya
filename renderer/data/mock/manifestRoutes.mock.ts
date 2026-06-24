import type { RouteEntry } from "@/types";

export const ROUTES: RouteEntry[] = [
  {
    path: "/dashboard",
    components: [
      { name: "NavBar", aiId: "nav-bar-0" },
      { name: "StatGrid", aiId: "stat-grid-0" },
    ],
  },
  {
    path: "/billing",
    components: [
      { name: "BillingButton", aiId: "button-billing-0" },
      { name: "InvoiceTable", aiId: "invoice-table-0" },
      { name: "ExportButton", aiId: "export-btn-0" },
    ],
  },
  {
    path: "/settings",
    components: [
      { name: "PlanCard", aiId: "plan-card-0" },
      { name: "ProfileForm", aiId: "profile-form-0" },
    ],
  },
  {
    path: "/checkout",
    components: [{ name: "CheckoutForm", aiId: "checkout-form-0" }],
  },
];

export const DEFAULT_SELECTED_ROUTE = "/billing";

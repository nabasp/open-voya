import type { ManifestEdge, ManifestNode, NodeDetail } from "@/types";

// Fixed mock graph for the Manifest → Graph (cytoscape) tab.
export const GRAPH_NODES: ManifestNode[] = [
  { id: "/dashboard", label: "/dashboard", type: "route" },
  { id: "/billing", label: "/billing", type: "route" },
  { id: "/settings", label: "/settings", type: "route" },
  { id: "/checkout", label: "/checkout", type: "route" },
  { id: "NavBar", label: "NavBar", type: "component" },
  { id: "BillingButton", label: "BillingButton", type: "component" },
  { id: "ExportButton", label: "ExportButton", type: "component" },
  { id: "InvoiceTable", label: "InvoiceTable", type: "component" },
  { id: "PlanCard", label: "PlanCard", type: "component" },
  { id: "CreateInvoiceModal", label: "CreateInvoiceModal", type: "component" },
  { id: "createInvoice", label: "createInvoice()", type: "action" },
  { id: "exportData", label: "exportData()", type: "action" },
  { id: "upgradePlan", label: "upgradePlan()", type: "action" },
  { id: "UpgradeFlow", label: "Upgrade plan", type: "flow" },
];

export const GRAPH_EDGES: ManifestEdge[] = [
  { source: "/dashboard", target: "NavBar", label: "renders" },
  { source: "/billing", target: "NavBar", label: "renders" },
  { source: "/checkout", target: "NavBar", label: "renders" },
  { source: "/billing", target: "BillingButton", label: "renders" },
  { source: "/billing", target: "InvoiceTable", label: "renders" },
  { source: "/billing", target: "ExportButton", label: "renders" },
  { source: "/settings", target: "PlanCard", label: "renders" },
  { source: "BillingButton", target: "createInvoice", label: "triggers" },
  { source: "BillingButton", target: "CreateInvoiceModal", label: "renders" },
  { source: "ExportButton", target: "exportData", label: "triggers" },
  { source: "PlanCard", target: "upgradePlan", label: "triggers" },
  { source: "UpgradeFlow", target: "/settings", label: "step" },
  { source: "UpgradeFlow", target: "/billing", label: "step" },
  { source: "UpgradeFlow", target: "/checkout", label: "step" },
];

export const NODE_DETAILS: Record<string, NodeDetail> = {
  "/dashboard": {
    title: "/dashboard",
    kind: "Route",
    fields: [
      { label: "path", value: "/dashboard" },
      { label: "component", value: "DashboardPage" },
      { label: "file", value: "src/pages/Dashboard.tsx" },
    ],
  },
  "/billing": {
    title: "/billing",
    kind: "Route",
    fields: [
      { label: "path", value: "/billing" },
      { label: "component", value: "BillingPage" },
      { label: "file", value: "src/pages/Billing.tsx" },
    ],
  },
  "/settings": {
    title: "/settings",
    kind: "Route",
    fields: [
      { label: "path", value: "/settings" },
      { label: "component", value: "SettingsPage" },
      { label: "file", value: "src/pages/Settings.tsx" },
    ],
  },
  "/checkout": {
    title: "/checkout",
    kind: "Route",
    fields: [
      { label: "path", value: "/checkout" },
      { label: "component", value: "CheckoutPage" },
      { label: "file", value: "src/pages/Checkout.tsx" },
    ],
  },
  NavBar: {
    title: "NavBar",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "nav-bar-0" },
      { label: "rendered on", value: "3 routes" },
      { label: "source file", value: "src/components/NavBar.tsx" },
    ],
  },
  BillingButton: {
    title: "BillingButton",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "button-billing-0" },
      { label: "rendered on", value: "/billing" },
      { label: "triggers", value: "createInvoice()" },
      { label: "source file", value: "src/pages/Billing.tsx" },
    ],
  },
  ExportButton: {
    title: "ExportButton",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "export-btn-0" },
      { label: "rendered on", value: "/billing" },
      { label: "triggers", value: "exportData()" },
      { label: "source file", value: "src/components/ExportButton.tsx" },
    ],
  },
  InvoiceTable: {
    title: "InvoiceTable",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "invoice-table-0" },
      { label: "rendered on", value: "/billing" },
      { label: "source file", value: "src/components/InvoiceTable.tsx" },
    ],
  },
  PlanCard: {
    title: "PlanCard",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "plan-card-0" },
      { label: "rendered on", value: "/settings" },
      { label: "triggers", value: "upgradePlan()" },
      { label: "source file", value: "src/components/PlanCard.tsx" },
    ],
  },
  CreateInvoiceModal: {
    title: "CreateInvoiceModal",
    kind: "Component",
    fields: [
      { label: "data-ai-id", value: "invoice-modal-0" },
      { label: "rendered on", value: "/billing" },
      { label: "source file", value: "src/components/CreateInvoiceModal.tsx" },
    ],
  },
  createInvoice: {
    title: "createInvoice()",
    kind: "Action",
    fields: [
      { label: "action", value: "createInvoice" },
      { label: "parent", value: "BillingButton" },
      { label: "type", value: "mutation" },
    ],
  },
  exportData: {
    title: "exportData()",
    kind: "Action",
    fields: [
      { label: "action", value: "exportData" },
      { label: "parent", value: "ExportButton" },
      { label: "type", value: "query" },
    ],
  },
  upgradePlan: {
    title: "upgradePlan()",
    kind: "Action",
    fields: [
      { label: "action", value: "upgradePlan" },
      { label: "parent", value: "PlanCard" },
      { label: "type", value: "navigate" },
    ],
  },
  UpgradeFlow: {
    title: "Upgrade plan",
    kind: "Flow",
    fields: [
      { label: "steps", value: "/settings → /billing → /checkout" },
      { label: "trigger", value: "PlanCard" },
    ],
  },
};

export const DEFAULT_SELECTED_NODE = "BillingButton";

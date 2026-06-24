import type { KnowledgeDoc } from "@/types";

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "route-/billing",
    type: "route",
    text: "Billing page — manage plan, view invoices, export…",
    file: "Billing.tsx",
  },
  {
    id: "component-BillingButton",
    type: "component",
    text: "Primary action that opens the create-invoice…",
    file: "Billing.tsx",
  },
  {
    id: "flow-upgrade-plan",
    type: "flow",
    text: "To upgrade: go to Settings, open Billing, then…",
    file: "manifest",
  },
  {
    id: "route-/settings",
    type: "route",
    text: "Settings page — profile, billing, preferences…",
    file: "Settings.tsx",
  },
  {
    id: "faq-cancel-plan",
    type: "faq",
    text: "You can cancel anytime from the Billing tab…",
    file: "knowledge",
  },
  {
    id: "component-InvoiceTable",
    type: "component",
    text: "Lists invoices with status and amount per row…",
    file: "InvoiceTable.tsx",
  },
  {
    id: "route-/checkout",
    type: "route",
    text: "Checkout page — confirm plan change and pay…",
    file: "Checkout.tsx",
  },
];

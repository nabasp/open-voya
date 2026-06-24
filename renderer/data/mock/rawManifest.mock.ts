// Raw manifest object shown (pretty-printed) in the Manifest → Raw JSON tab.
export const RAW_MANIFEST = {
  name: "billing-app",
  model: "qwen2.5-3b",
  quant: "Q4_K_M",
  routes: [
    { path: "/billing", component: "BillingPage", file: "src/pages/Billing.tsx" },
    { path: "/settings", component: "SettingsPage", file: "src/pages/Settings.tsx" },
  ],
  components: [
    {
      name: "BillingButton",
      aiId: "button-billing-0",
      props: ["variant", "onClick"],
      triggers: ["createInvoice"],
    },
  ],
  userFlows: [{ name: "Upgrade plan", steps: ["/settings", "/billing", "/checkout"] }],
  knowledgeDocs: 142,
};

export const RAW_MANIFEST_JSON = JSON.stringify(RAW_MANIFEST, null, 2);

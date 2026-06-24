/**
 * Non-shadcn design constants — the handful of raw values the CSS-variable
 * theme has no concept of. Everything else is driven by the cream palette
 * mapped onto shadcn's CSS variables in `globals.css`.
 */

// macOS-style window control dots in the custom TitleBar.
export const TRAFFIC_LIGHTS = {
  idle: "#d7d4c9",
  idleHover: "#c7c2b6",
  close: "#e50914",
  closeHover: "#c40711",
} as const;

// Connection / status dots (StatusBar + project status pills).
export const STATUS_DOT = {
  ready: "#1e7a3d",
  generating: "#c98a1b",
  error: "#e0402a",
  online: "#1e7a3d",
} as const;

// cytoscape graph palette (Manifest → Graph tab). cytoscape is a raw canvas
// renderer and cannot read CSS variables, so these mirror the design exactly.
export const GRAPH_COLORS = {
  accent: "#e50914",
  nodeBg: "#ffffff",
  nodeBorder: "#b3aea2",
  routeBg: "#ece6da",
  routeBorder: "#14130f",
  flowBg: "#16150f",
  edge: "#b9b6ab",
  selBg: "#f5ddd8",
  text: "#14130f",
  mutedText: "#6b6a64",
  edgeLabelBg: "#efece3",
} as const;

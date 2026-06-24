import * as React from "react";

import { Panel, PanelLabel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GRAPH_COLORS } from "@/styles/theme";
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  NODE_DETAILS,
  DEFAULT_SELECTED_NODE,
} from "@/data/mock/manifestGraph.mock";

const LEGEND = [
  { label: "Route", node: <span className="size-3.25 rounded-full border-2 border-[#c7c2b6] bg-[#e9e5da]" /> },
  { label: "Component", node: <span className="size-2.75 rounded-full border border-[#c7c2b6] bg-[#efece3]" /> },
  { label: "Action", node: <span className="size-2.5 rounded-full border-[1.5px] border-dashed border-primary bg-[#f7f6f2]" /> },
  { label: "Flow", node: <span className="size-2.75 rotate-45 bg-[#16150f]" /> },
];

function buildStyle() {
  const A = GRAPH_COLORS.accent;
  return [
    {
      selector: "node",
      style: {
        "background-color": GRAPH_COLORS.nodeBg,
        "border-color": GRAPH_COLORS.nodeBorder,
        "border-width": 1.5,
        label: "data(label)",
        "font-family": "Space Mono, monospace",
        "font-size": 10,
        color: GRAPH_COLORS.text,
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-y": -4,
        width: 32,
        height: 32,
      },
    },
    {
      selector: 'node[type="route"]',
      style: {
        width: 48,
        height: 48,
        "border-width": 2,
        "border-color": GRAPH_COLORS.routeBorder,
        "background-color": GRAPH_COLORS.routeBg,
        "font-weight": "bold",
        "font-size": 11,
      },
    },
    {
      selector: 'node[type="action"]',
      style: {
        width: 24,
        height: 24,
        "border-style": "dashed",
        "border-width": 1.5,
        "border-color": A,
        "background-color": GRAPH_COLORS.nodeBg,
        "font-size": 9,
        color: GRAPH_COLORS.mutedText,
      },
    },
    {
      selector: 'node[type="flow"]',
      style: {
        shape: "diamond",
        "background-color": GRAPH_COLORS.flowBg,
        "border-color": GRAPH_COLORS.flowBg,
        width: 42,
        height: 42,
        color: GRAPH_COLORS.text,
        "font-weight": "bold",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1.5,
        "line-color": GRAPH_COLORS.edge,
        "target-arrow-color": GRAPH_COLORS.edge,
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.9,
        "curve-style": "bezier",
        label: "data(label)",
        "font-family": "Space Mono",
        "font-size": 7.5,
        color: GRAPH_COLORS.mutedText,
        "text-rotation": "autorotate",
        "text-background-color": GRAPH_COLORS.edgeLabelBg,
        "text-background-opacity": 1,
        "text-background-padding": 2,
      },
    },
    { selector: ".sel", style: { "border-color": A, "border-width": 3, "background-color": GRAPH_COLORS.selBg } },
    { selector: ".faded", style: { opacity: 0.2 } },
    { selector: "edge.hl", style: { "line-color": A, "target-arrow-color": A, width: 2.4, color: A } },
  ];
}

export function GraphTab() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cyRef = React.useRef<any>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = React.useState(DEFAULT_SELECTED_NODE);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined" || !containerRef.current) return;
      const cytoscape = (await import("cytoscape")).default;
      if (cancelled || !containerRef.current) return;

      const elements = [
        ...GRAPH_NODES.map((n) => ({ data: { id: n.id, label: n.label, type: n.type } })),
        ...GRAPH_EDGES.map((e, i) => ({
          data: { id: "e" + i, source: e.source, target: e.target, label: e.label },
        })),
      ];

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        minZoom: 0.3,
        maxZoom: 2.5,
        style: buildStyle() as any,
        layout: {
          name: "cose",
          animate: false,
          padding: 40,
          nodeRepulsion: 9000,
          idealEdgeLength: 95,
          nodeOverlap: 18,
          gravity: 0.3,
        } as any,
      });
      cyRef.current = cy;

      cy.on("tap", "node", (evt: any) => {
        const id = evt.target.id();
        cy.nodes().removeClass("sel");
        evt.target.addClass("sel");
        setSelected(id);
      });
      cy.on("mouseover", "node", (evt: any) => {
        const n = evt.target;
        cy.elements().addClass("faded");
        n.closedNeighborhood().removeClass("faded");
        n.connectedEdges().addClass("hl");
      });
      cy.on("mouseout", "node", () => {
        cy.elements().removeClass("faded");
        cy.edges().removeClass("hl");
      });

      const initial = cy.getElementById(DEFAULT_SELECTED_NODE);
      if (initial) initial.addClass("sel");

      const refit = () => {
        try {
          cy.resize();
          cy.fit(undefined, 55);
        } catch {
          /* noop */
        }
      };
      setTimeout(refit, 60);
      setTimeout(refit, 280);
    })();

    return () => {
      cancelled = true;
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch {
          /* noop */
        }
        cyRef.current = null;
      }
    };
  }, []);

  const zoomBy = (factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };
  const fit = () => cyRef.current?.fit(undefined, 50);
  const resetLayout = () =>
    cyRef.current
      ?.layout({ name: "cose", animate: true, padding: 40, nodeRepulsion: 9000, idealEdgeLength: 95 })
      .run();
  const find = () => {
    const cy = cyRef.current;
    const q = searchRef.current?.value.trim().toLowerCase();
    if (!q || !cy) return;
    const node = cy.nodes().filter((n: any) => n.data("label").toLowerCase().includes(q))[0];
    if (node) {
      cy.nodes().removeClass("sel");
      node.addClass("sel");
      cy.animate({ center: { eles: node }, zoom: 1.4 }, { duration: 350 });
      setSelected(node.id());
    }
  };

  const detail = NODE_DETAILS[selected] ?? NODE_DETAILS[DEFAULT_SELECTED_NODE];

  return (
    <div className="grid grid-cols-[1fr_300px] gap-4.5">
      <div className="relative h-135rflow-hidden rounded-xl border border-border bg-card">
        {/* legend */}
        <div className="absolute top-3.5 left-3.5 z-3 flex flex-col gap-1.75 rounded-lg border border-border bg-[#f7f6f2]/90 px-3 py-2.5 text-[10.5px] text-[#52514a]">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              {l.node}
              {l.label}
            </div>
          ))}
        </div>

        {/* search */}
        <div className="absolute top-3.5 right-3.5 z-3 flex gap-1.75">
          <Input
            ref={searchRef}
            placeholder="Find node…"
            onKeyDown={(e) => e.key === "Enter" && find()}
            className="w-37.5 bg-[#f7f6f2]/95 text-[11px]"
          />
          <Button
            onClick={find}
            className="bg-[#14130f] px-3 text-[11px] text-[#f3f1ea] hover:bg-black"
          >
            Go
          </Button>
        </div>

        {/* canvas */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* toolbar */}
        <div className="absolute bottom-3.5 left-3.5 z-3 flex gap-1.75">
          <Button variant="outline" size="icon" onClick={() => zoomBy(0.8)} className="bg-[#f7f6f2]/95 text-base">
            −
          </Button>
          <Button variant="outline" size="icon" onClick={() => zoomBy(1.25)} className="bg-[#f7f6f2]/95 text-base">
            +
          </Button>
          <Button variant="outline" onClick={fit} className="bg-[#f7f6f2]/95 text-[11px]">
            Fit to screen
          </Button>
          <Button variant="outline" onClick={resetLayout} className="bg-[#f7f6f2]/95 text-[11px]">
            Reset layout
          </Button>
        </div>
      </div>

      {/* detail */}
      <Panel className="h-135 overflow-y-auto">
        <PanelLabel className="mb-3.5">Detail</PanelLabel>
        <div className="text-base font-bold tracking-tight">{detail.title}</div>
        <div className="mt-2 inline-flex rounded-full border border-[#cbc8bd] px-2.5 py-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
          {detail.kind}
        </div>
        <div className="mt-4.5 flex flex-col gap-2.5">
          {detail.fields.map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="text-[9.5px] tracking-[0.6px] text-muted-foreground uppercase">
                {f.label}
              </div>
              <div className="mt-1 text-[12.5px] font-bold break-all">{f.value}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

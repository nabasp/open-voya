import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Project } from "@/types";

function StatRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-bold text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="gap-0 border border-border py-5 ring-0 transition-colors [--card-spacing:--spacing(5)] hover:border-[#c7c2b6]">
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <StatusBadge status={project.status} />
          <span className="text-[10.5px] text-[#9a9890]">{project.updatedLabel}</span>
        </div>

        <div className="mt-3.5 text-base font-bold tracking-tight">{project.name}</div>
        <div className="mt-1 text-[11px] text-[#9a9890]">{project.repo}</div>

        <Separator className="my-3.75" />

        {project.status === "error" ? (
          <div className="rounded-lg border border-error/25 bg-error/[0.07] px-3 py-2.5 text-[11.5px] leading-relaxed text-error">
            {project.error}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 text-xs text-[#52514a]">
            <StatRow label="routes" value={String(project.routes)} />
            <StatRow label="data-ai-id targets" value={String(project.targets)} />
            <StatRow label="model" value={project.model ?? ""} muted />
          </div>
        )}

        {project.status === "generating" && (
          <div className="mt-4">
            <Progress
              value={project.progress}
              className="h-1.5 bg-[#ddd9cf] **:data-[slot=progress-indicator]:bg-warning"
            />
            <div className="mt-1.5 flex justify-between text-[10.5px] text-muted-foreground">
              <span>{project.progressLabel}</span>
              <span>{project.progress}%</span>
            </div>
          </div>
        )}

        {/* footer actions */}
        <div className="mt-auto pt-4.5">
          {project.status === "ready" && (
            <div className="flex gap-2.5">
              <Button
                asChild
                className="flex-1 bg-[#14130f] text-[#f3f1ea] hover:bg-black"
              >
                <Link href="/project/manifest">Open</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/project/export">
                  Export
                  <ChevronDown />
                </Link>
              </Button>
            </div>
          )}

          {project.status === "generating" && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/project/build">View build log</Link>
            </Button>
          )}

          {project.status === "error" && (
            <Button variant="outline" className="w-full">
              Retry build
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

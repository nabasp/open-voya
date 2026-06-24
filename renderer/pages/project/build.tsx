import Head from "next/head";

import { ProjectWorkspace } from "@/components/layout/ProjectWorkspace";
import { PipelineStageList } from "@/components/build/PipelineStageList";
import { LiveLogPanel } from "@/components/build/LiveLogPanel";
import { BuildStatStrip } from "@/components/build/BuildStatStrip";

export default function BuildPage() {
  return (
    <>
      <Head>
        <title>open voya — Build</title>
      </Head>
      <ProjectWorkspace>
        <div className="grid grid-cols-2 gap-4.5">
          <PipelineStageList />
          <LiveLogPanel />
        </div>
        <div className="mt-4.5">
          <BuildStatStrip />
        </div>
      </ProjectWorkspace>
    </>
  );
}

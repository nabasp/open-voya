import Head from "next/head";

import { ProjectWorkspace } from "@/components/layout/ProjectWorkspace";
import { ExportSummary } from "@/components/export/ExportSummary";
import { PackageConfigForm } from "@/components/export/PackageConfigForm";
import { InstallInstructions } from "@/components/export/InstallInstructions";
import { ExportAction } from "@/components/export/ExportAction";

export default function ExportPage() {
  return (
    <>
      <Head>
        <title>open voya — Export</title>
      </Head>
      <ProjectWorkspace>
        <ExportSummary />
        <div className="grid grid-cols-2 gap-4.5">
          <PackageConfigForm />
          <div className="flex flex-col gap-4.5">
            <InstallInstructions />
            <ExportAction />
          </div>
        </div>
      </ProjectWorkspace>
    </>
  );
}

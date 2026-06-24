import Head from "next/head";

import { ProjectWorkspace } from "@/components/layout/ProjectWorkspace";
import { ManifestTabs } from "@/components/manifest/ManifestTabs";

export default function ManifestPage() {
  return (
    <>
      <Head>
        <title>open voya — Manifest</title>
      </Head>
      <ProjectWorkspace>
        <ManifestTabs />
      </ProjectWorkspace>
    </>
  );
}

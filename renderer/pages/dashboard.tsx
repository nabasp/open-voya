import Head from "next/head";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";
import { useImportDialog } from "@/components/layout/AppLayout";

export default function DashboardPage() {
  const { openImport } = useImportDialog();

  return (
    <>
      <Head>
        <title>open voya — Projects</title>
      </Head>

      <div className="flex flex-wrap items-end justify-between gap-4.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1.75 text-xs text-muted-foreground">
            Every imported repo. Resume a build, inspect a manifest, or export a
            package.
          </p>
        </div>
        <Button
          onClick={openImport}
          className="h-auto bg-[#14130f] px-4.5 py-2.5 text-[12.5px] text-[#f3f1ea] hover:bg-black"
        >
          <Plus />
          New Project
        </Button>
      </div>

      <SearchBar className="mt-5.5" />
      <ProjectGrid />
    </>
  );
}

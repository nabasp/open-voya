import * as React from "react";

import { TitleBar } from "@/components/layout/TitleBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { ImportDialog } from "@/components/project/ImportDialog";

interface ImportDialogContextValue {
  openImport: () => void;
}

const ImportDialogContext = React.createContext<ImportDialogContextValue | null>(
  null
);

/** Hook used by "New Project" / "Import repo" triggers anywhere in the app. */
export function useImportDialog(): ImportDialogContextValue {
  const ctx = React.useContext(ImportDialogContext);
  if (!ctx) {
    throw new Error("useImportDialog must be used within <AppLayout>");
  }
  return ctx;
}

/**
 * Single app shell: TitleBar → (Sidebar + page) → StatusBar, filling the
 * Electron viewport. Mounts the ImportDialog once and exposes openImport().
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [importOpen, setImportOpen] = React.useState(false);
  const value = React.useMemo(
    () => ({ openImport: () => setImportOpen(true) }),
    []
  );

  return (
    <ImportDialogContext.Provider value={value}>
      <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
        <TitleBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto bg-background">
            <div className="mx-auto max-w-7xl px-8.5 pt-7.5 pb-11">
              {children}
            </div>
          </main>
        </div>
        <StatusBar />
      </div>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </ImportDialogContext.Provider>
  );
}

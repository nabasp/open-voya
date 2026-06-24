import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { cn } from "@/lib/utils";

const PROJECT_NAME = "billing-app";

const TABS = [
  { label: "Build", href: "/project/build" },
  { label: "Manifest", href: "/project/manifest" },
  { label: "Export", href: "/project/export" },
];

/**
 * Shared wrapper for the project sub-screens: breadcrumb + Build/Manifest/Export
 * sub-tab bar, then the active page body. Active tab is derived from the route.
 */
export function ProjectWorkspace({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const current = TABS.find((t) => t.href === pathname) ?? TABS[0];

  return (
    <div>
      {/* breadcrumb */}
      <div className="mb-4 text-[13px]">
        <span className="text-[#9a9890]">{PROJECT_NAME}</span>
        <span className="mx-2 text-[#c7c2b6]">/</span>
        <span className="font-bold">{current.label}</span>
      </div>

      {/* sub-nav */}
      <div className="mb-5.5 flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const active = tab.href === pathname;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.75 text-[13px] transition-colors",
                active
                  ? "border-primary font-bold text-foreground"
                  : "border-transparent text-[#9a9890] hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}

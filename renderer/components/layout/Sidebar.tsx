import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { LayoutGrid, FolderCheck, Settings, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: (pathname: string) => boolean;
}

const TOP_ITEMS: NavItem[] = [
  {
    label: "Projects",
    href: "/dashboard",
    icon: LayoutGrid,
    isActive: (p) => p === "/dashboard",
  },
  {
    label: "Active",
    href: "/project/build",
    icon: FolderCheck,
    isActive: (p) => p.startsWith("/project"),
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    isActive: (p) => p === "/settings",
  },
  // Docs is decorative — no route this pass.
  { label: "Docs", icon: FileText },
];

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const className = cn(
    "h-[54px] w-[54px] flex-col gap-1.5 rounded-[10px] p-0 text-[9px] tracking-wide font-normal",
    active
      ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary/10 hover:text-primary"
      : "text-[#9a9890] hover:bg-accent hover:text-[#5c5b54]"
  );

  const content = (
    <>
      <Icon className="size-5.5" />
      <span>{item.label}</span>
    </>
  );

  if (!item.href) {
    return (
      <Button variant="ghost" className={className} title={item.label}>
        {content}
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" className={className} title={item.label}>
      <Link href={item.href}>{content}</Link>
    </Button>
  );
}

export function Sidebar() {
  const { pathname } = useRouter();

  return (
    <nav className="flex w-18 shrink-0 flex-col items-center gap-2 border-r border-[#d7d4c9] bg-chrome py-5.5">
      {TOP_ITEMS.map((item) => (
        <NavButton
          key={item.label}
          item={item}
          active={item.isActive?.(pathname) ?? false}
        />
      ))}
      <div className="flex-1" />
      {BOTTOM_ITEMS.map((item) => (
        <NavButton
          key={item.label}
          item={item}
          active={item.isActive?.(pathname) ?? false}
        />
      ))}
    </nav>
  );
}


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { GeneralPanel } from "@/components/settings/GeneralPanel";
import { ModelsPanel } from "@/components/settings/ModelsPanel";
import { PrivacyPanel } from "@/components/settings/PrivacyPanel";
import { UpdatesPanel } from "@/components/settings/UpdatesPanel";

const TABS = [
  { value: "general", label: "General", content: <GeneralPanel /> },
  { value: "models", label: "Models", content: <ModelsPanel /> },
  { value: "privacy", label: "Privacy", content: <PrivacyPanel /> },
  { value: "updates", label: "Updates", content: <UpdatesPanel /> },
];

const triggerClass = cn(
  "h-auto justify-start rounded-lg px-3.5 py-[11px] text-left text-[13px] text-muted-foreground",
  "after:hidden hover:text-foreground",
  "data-active:bg-primary/10 data-active:font-bold data-active:text-primary data-active:shadow-none"
);

export function SettingsNav() {
  return (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      className="grid grid-cols-[192px_1fr] gap-6.5"
    >
      <TabsList
        variant="line"
        className="h-fit flex-col items-stretch gap-0.75 bg-transparent p-0"
      >
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className={triggerClass}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0">
            {t.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_DOCS } from "@/data/mock/knowledgeDocs.mock";
import type { KnowledgeDocType } from "@/types";

const TYPE_COLOR: Record<KnowledgeDocType, string> = {
  route: "text-[#3b6fa0] border-[#3b6fa0]/30",
  component: "text-[#6b6a64] border-[#6b6a64]/30",
  flow: "text-[#16150f] border-[#16150f]/30",
  faq: "text-[#c98a1b] border-[#c98a1b]/30",
};

const HEAD =
  "text-[10px] tracking-[0.8px] uppercase text-muted-foreground";

export function KnowledgeDocsTab() {
  return (
    <div>
      <SearchBar placeholder="Search knowledge docs…" className="mb-3.5" />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn("w-50 px-4.5 py-3", HEAD)}>id</TableHead>
              <TableHead className={cn("w-27.5", HEAD)}>type</TableHead>
              <TableHead className={HEAD}>text</TableHead>
              <TableHead className={cn("w-50", HEAD)}>sourceFile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {KNOWLEDGE_DOCS.map((doc) => (
              <TableRow key={doc.id} className="border-[#e3dfd5] hover:bg-surface">
                <TableCell className="px-4.5 py-3 text-xs font-bold break-all whitespace-normal">
                  {doc.id}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full border bg-black/4 px-2 py-0.5 text-[10px] tracking-wide uppercase",
                      TYPE_COLOR[doc.type]
                    )}
                  >
                    {doc.type}
                  </span>
                </TableCell>
                <TableCell className="overflow-hidden pr-3 text-xs text-ellipsis text-[#52514a]">
                  {doc.text}
                </TableCell>
                <TableCell className="text-xs break-all whitespace-normal text-[#9a9890]">
                  {doc.file}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

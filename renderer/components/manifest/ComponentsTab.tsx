
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPONENTS } from "@/data/mock/manifestComponents.mock";

export function ComponentsTab() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4.5 py-3.5 text-[10px] tracking-[0.8px] text-muted-foreground uppercase">
              Component
            </TableHead>
            <TableHead className="w-55 text-[10px] tracking-[0.8px] text-muted-foreground uppercase">
              data-ai-id
            </TableHead>
            <TableHead className="w-40 text-[10px] tracking-[0.8px] text-muted-foreground uppercase">
              props
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPONENTS.map((c) => (
            <TableRow key={c.aiId} className="border-[#e3dfd5] hover:bg-surface">
              <TableCell className="px-4.5 py-3.5 text-[12.5px] font-bold">
                {c.name}
              </TableCell>
              <TableCell className="text-[12.5px] text-primary">{c.aiId}</TableCell>
              <TableCell className="text-[12.5px] text-muted-foreground">{c.props}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

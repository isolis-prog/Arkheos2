import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Clock } from 'lucide-react';
import type { HedgeRelationship } from '@/hooks/useHedgeAccounting';

interface Props {
  relationships: HedgeRelationship[];
  onSelect: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  designated: 'bg-info/10 text-info',
  active: 'bg-success/10 text-success',
  de_designated: 'bg-warning/10 text-warning',
  expired: 'bg-muted text-muted-foreground',
  matured: 'bg-secondary text-secondary-foreground',
};

const methodLabel: Record<string, string> = {
  cash_flow: 'Cash Flow',
  fair_value: 'Fair Value',
  net_investment: 'Net Investment',
};

const fmt = (v: number) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export const RelationshipsTable = ({ relationships, onSelect }: Props) => {
  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Designation</TableHead>
            <TableHead>Exposure</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Standard</TableHead>
            <TableHead className="text-right">Notional</TableHead>
            <TableHead>Ratio</TableHead>
            <TableHead>Doc Completeness</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Maturity</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {relationships.map((r) => {
            const checklistValues = Object.values(r.documentationChecklist);
            const docPct = checklistValues.length > 0 ? (checklistValues.filter(Boolean).length / checklistValues.length) * 100 : 0;

            return (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(r.id)}>
                <TableCell className="font-mono font-medium text-sm">{r.designationRef}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{r.exposureDescription}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{methodLabel[r.method]}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{r.accountingStandard}</Badge></TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.notionalAmount)}</TableCell>
                <TableCell className="text-sm">{(r.hedgeRatio * 100).toFixed(0)}%</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={docPct} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground">{Math.round(docPct)}%</span>
                  </div>
                </TableCell>
                <TableCell><Badge className={`text-xs ${statusStyles[r.status]}`}>{r.status.replace('_', '-')}</Badge></TableCell>
                <TableCell>
                  {r.daysToMaturity !== null ? (
                    <span className={`flex items-center gap-1 text-xs ${r.daysToMaturity <= 60 ? 'text-warning' : 'text-muted-foreground'}`}>
                      <Clock className="h-3 w-3" />{r.daysToMaturity}d
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelect(r.id); }}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

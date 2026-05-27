import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ISOStatement } from '@/hooks/useISOSettlements';
import { Eye } from 'lucide-react';

interface Props {
  statements: ISOStatement[];
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-muted text-muted-foreground',
  parsing: 'bg-blue-500/10 text-blue-700 border-blue-300',
  parsed: 'bg-blue-500/10 text-blue-700 border-blue-300',
  reconciling: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  reconciled: 'bg-green-500/10 text-green-700 border-green-300',
  error: 'bg-red-500/10 text-red-700 border-red-300',
};

export const StatementsTable = ({ statements, onSelect }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Statement</TableHead>
          <TableHead>ISO</TableHead>
          <TableHead>Market</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Lines</TableHead>
          <TableHead className="text-right">Total $</TableHead>
          <TableHead>Matched</TableHead>
          <TableHead>Breaks</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {statements.map(s => (
          <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(s.id)}>
            <TableCell className="font-mono text-sm">{s.statementRef}</TableCell>
            <TableCell><Badge variant="outline">{s.isoName}</Badge></TableCell>
            <TableCell><Badge variant="secondary">{s.marketType}</Badge></TableCell>
            <TableCell className="text-sm">{s.periodStart} → {s.periodEnd}</TableCell>
            <TableCell className="font-mono text-sm">{s.totalLines.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono text-sm">${s.totalAmount.toLocaleString()}</TableCell>
            <TableCell>
              {s.status === 'reconciled' ? (
                <div className="flex items-center gap-2">
                  <Progress value={s.matchedPct} className="h-2 w-16" />
                  <span className="text-xs font-mono">{s.matchedPct.toFixed(0)}%</span>
                </div>
              ) : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell>
              {s.breakCount > 0 ? (
                <Badge variant="destructive">{s.breakCount} / ${(s.breakAmount / 1000).toFixed(0)}K</Badge>
              ) : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell><Badge variant="outline" className={statusColors[s.status]}>{s.status}</Badge></TableCell>
            <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

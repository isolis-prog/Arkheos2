import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ISOReconResult, ISOStatement } from '@/hooks/useISOSettlements';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
  statement: ISOStatement;
  results: ISOReconResult[];
  chargeTypeFilter: string;
  setChargeTypeFilter: (v: string) => void;
  onBack: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  matched: 'bg-green-500/10 text-green-700 border-green-300',
  break: 'bg-red-500/10 text-red-700 border-red-300',
  adjusted: 'bg-blue-500/10 text-blue-700 border-blue-300',
  resolved: 'bg-primary/10 text-primary border-primary/30',
};

const rootCauseLabels: Record<string, string> = {
  node_mismatch: 'Node Mismatch', missing_interval: 'Missing Interval',
  uplift_allocation: 'Uplift Alloc.', negative_price: 'Neg. Price',
  price_delta: 'Price Delta', mw_delta: 'MW Delta',
  timezone_shift: 'TZ Shift', rounding: 'Rounding',
};

const chargeLabels: Record<string, string> = {
  energy_da: 'Energy DA', energy_rt: 'Energy RT', congestion: 'Congestion',
  losses: 'Losses', uplift: 'Uplift', ancillary_reg: 'Anc. Reg',
  ancillary_spin: 'Anc. Spin', capacity: 'Capacity',
};

export const ReconDrilldown = ({ statement: s, results, chargeTypeFilter, setChargeTypeFilter, onBack }: Props) => {
  const breaks = results.filter(r => r.status === 'break');
  const matched = results.filter(r => r.status === 'matched' || r.status === 'resolved');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h2 className="text-lg font-semibold">{s.statementRef}</h2>
        <Badge variant="outline">{s.isoName}</Badge>
        <Badge variant="secondary">{s.marketType}</Badge>
        <span className="text-sm text-muted-foreground ml-auto">
          {matched.length} matched · <span className="text-destructive">{breaks.length} breaks</span> · {results.length} total
        </span>
        <Select value={chargeTypeFilter} onValueChange={setChargeTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Charge Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Charges</SelectItem>
            {Object.entries(chargeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead>Root Cause</TableHead>
              <TableHead>GL</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.slice(0, 50).map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.node}</TableCell>
                <TableCell className="text-sm">{r.zone}</TableCell>
                <TableCell className="font-mono text-xs">{r.intervalDt ? format(new Date(r.intervalDt), 'MM/dd HH:mm') : '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{chargeLabels[r.chargeType] || r.chargeType}</Badge></TableCell>
                <TableCell className="text-right font-mono text-xs">${r.expectedAmount.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-xs">${r.actualAmount.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  <span className={Math.abs(r.delta) > 1 ? (r.delta > 0 ? 'text-destructive' : 'text-green-600') : ''}>
                    {r.delta > 0 ? '+' : ''}{r.delta.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  {r.rootCauseCode ? (
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700 border-orange-300">
                      {rootCauseLabels[r.rootCauseCode] || r.rootCauseCode}
                    </Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.glAccount.split('-')[0]}</TableCell>
                <TableCell><Badge variant="outline" className={`text-xs ${statusColors[r.status]}`}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {results.length > 50 && <p className="text-xs text-muted-foreground text-center">Showing 50 of {results.length} results</p>}
    </div>
  );
};

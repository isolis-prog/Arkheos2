import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { CreditFile } from '@/hooks/useCreditRiskManagement';
import { Progress } from '@/components/ui/progress';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CLOSED: 'bg-muted text-muted-foreground',
};

function scoreColor(score: number) {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-amber-600';
  return 'text-red-600';
}

function utilizationColor(pct: number) {
  if (pct < 75) return 'bg-green-500';
  if (pct < 90) return 'bg-amber-500';
  return 'bg-red-500';
}

interface Props {
  files: CreditFile[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const CreditFilesTab = ({ files, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search counterparty, analyst…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {['ACTIVE', 'UNDER_REVIEW', 'SUSPENDED', 'CLOSED'].map(s => (
            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Counterparty Credit Files ({files.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Counterparty</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Approved Line</TableHead>
              <TableHead className="text-right">Net Exposure</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead className="text-right">Collateral</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Analyst</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.counterparty}</TableCell>
                <TableCell className="text-center"><span className={`font-bold text-lg ${scoreColor(f.credit_score)}`}>{f.credit_score}</span></TableCell>
                <TableCell className="font-mono text-sm">{f.external_rating}</TableCell>
                <TableCell className="text-right font-mono">${(f.approved_line_usd / 1e6).toFixed(0)}M</TableCell>
                <TableCell className="text-right font-mono">${(f.net_exposure / 1e6).toFixed(1)}M</TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Progress value={f.utilization} className={`h-2 flex-1 [&>div]:${utilizationColor(f.utilization)}`} />
                    <span className="text-xs font-mono w-10 text-right">{f.utilization.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{f.collateral_held_usd > 0 ? `$${(f.collateral_held_usd / 1e6).toFixed(0)}M` : '—'}</TableCell>
                <TableCell className="text-sm">{f.line_expiry}</TableCell>
                <TableCell className="text-sm">{f.review_date}</TableCell>
                <TableCell className="text-sm">{f.analyst}</TableCell>
                <TableCell><Badge className={statusColors[f.status] || ''}>{f.status.replace('_', ' ')}</Badge></TableCell>
              </TableRow>
            ))}
            {files.length === 0 && (
              <TableRow><TableCell colSpan={11} className="h-24 text-center text-muted-foreground">No credit files match filters</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

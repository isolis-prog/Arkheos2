import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import type { DailySignoff } from '@/hooks/useMiddleOfficeControl';

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  SIGNED_OFF: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  ISSUES_OPEN: 'bg-destructive/10 text-destructive',
};

interface Props {
  data: DailySignoff[];
}

export function ExposureDashboardTab({ data }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-lg font-semibold">Daily Exposure Control</h3>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold text-right">Gross Exposure</TableHead>
                <TableHead className="font-semibold text-right">Net Exposure</TableHead>
                <TableHead className="font-semibold text-right">VaR (1d)</TableHead>
                <TableHead className="font-semibold">Limit Util.</TableHead>
                <TableHead className="font-semibold">Sign-Off</TableHead>
                <TableHead className="font-semibold">Issues</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(s => {
                const utilColor = s.limit_util_pct > 90 ? 'text-destructive' : s.limit_util_pct > 75 ? 'text-amber-600' : 'text-emerald-600';
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.desk_id}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(s.gross_exposure)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(s.net_exposure)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(s.var_1d)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.limit_util_pct} className="h-2 w-20" />
                        <span className={`font-mono text-sm font-bold ${utilColor}`}>{s.limit_util_pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={statusColors[s.status] || ''} variant="outline">{s.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">{s.open_issues || '—'}</TableCell>
                    <TableCell>
                      {s.status !== 'SIGNED_OFF' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <CheckCircle className="h-3 w-3" /> Sign Off
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

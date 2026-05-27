import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowDownUp } from 'lucide-react';
import type { FXFundingGap } from '@/hooks/useFXTreasury';

interface Props {
  gaps: FXFundingGap[];
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v >= 0 ? '+' : '-';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

const fmtAbs = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
};

export function FXFundingTab({ gaps }: Props) {
  const gapsWithIssue = gaps.filter((g) => g.hasGap);
  const weeks = [...new Set(gaps.map((g) => g.week))];

  return (
    <div className="space-y-6">
      {gapsWithIssue.length > 0 && (
        <div className="space-y-2">
          {gapsWithIssue.map((g, i) => (
            <div key={i} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">{g.currency}</span> funding gap of <span className="text-destructive font-semibold">{fmtAbs(Math.abs(g.gap))}</span> in {g.week}.
                Treasury should plan FX swap or funding.
              </p>
            </div>
          ))}
        </div>
      )}

      {weeks.map((week) => {
        const weekGaps = gaps.filter((g) => g.week === week);
        return (
          <Card key={week}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5" />
                {week}
                {weekGaps.some((g) => g.hasGap) && (
                  <Badge variant="outline" className="text-xs text-destructive border-destructive ml-2">Gap Detected</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Expected Inflows</TableHead>
                    <TableHead className="text-right">Expected Outflows</TableHead>
                    <TableHead className="text-right">Net Flow</TableHead>
                    <TableHead className="text-right">Available Cash</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weekGaps.map((g) => (
                    <TableRow key={`${g.week}-${g.currency}`} className={g.hasGap ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">{g.currency}</TableCell>
                      <TableCell className="text-right text-success">{fmtAbs(g.inflows)}</TableCell>
                      <TableCell className="text-right text-destructive">{fmtAbs(g.outflows)}</TableCell>
                      <TableCell className={`text-right font-semibold ${g.netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {fmt(g.netFlow)}
                      </TableCell>
                      <TableCell className="text-right">{fmtAbs(g.availableCash)}</TableCell>
                      <TableCell className={`text-right font-semibold ${g.hasGap ? 'text-destructive' : ''}`}>
                        {g.hasGap ? fmt(g.gap) : '-'}
                      </TableCell>
                      <TableCell>
                        {g.hasGap ? (
                          <Badge variant="outline" className="text-xs text-destructive border-destructive">Action Required</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

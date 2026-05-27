import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import type { MarketCurve, MarketPoint } from '@/hooks/useMarketData';

interface Props {
  curve: MarketCurve;
  points: MarketPoint[];
  onBack: () => void;
}

const statusStyles: Record<string, string> = {
  locked: 'bg-success/10 text-success border-success',
  validated: 'bg-primary/10 text-primary border-primary',
  provisional: 'bg-warning/10 text-warning border-warning',
  superseded: 'bg-muted text-muted-foreground border-muted',
};

export const CurveDetailPanel = ({ curve, points, onBack }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
      <div>
        <h2 className="text-xl font-semibold">{curve.name}</h2>
        <p className="text-sm text-muted-foreground">{curve.commodity} · {curve.location ?? 'Global'} · {curve.currency}</p>
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm"><Lock className="h-4 w-4 mr-1" /> Lock Period</Button>
        <Button variant="outline" size="sm"><Unlock className="h-4 w-4 mr-1" /> Unlock</Button>
      </div>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">Tenor Points</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenor</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-center">Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Locked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{format(new Date(p.tenorDt), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right font-mono">{p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {p.change !== null ? (
                      <span className={`flex items-center justify-end gap-1 text-xs ${p.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {p.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {p.change > 0 ? '+' : ''}{p.change.toFixed(2)} ({p.changePct?.toFixed(2)}%)
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center text-xs">v{p.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusStyles[p.status]}`}>
                      {p.lockedFlag && <Lock className="h-3 w-3 mr-1" />}
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.source.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.lockedBy ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
);

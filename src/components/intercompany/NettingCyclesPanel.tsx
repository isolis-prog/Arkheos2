import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileCheck } from 'lucide-react';
import type { NettingCycle } from '@/hooks/useIntercompany';

interface Props {
  cycles: NettingCycle[];
}

const fmt = (n: number) => `$${(n / 1e6).toFixed(1)}M`;

const statusIcon: Record<string, typeof Clock> = { draft: Clock, proposed: FileCheck, approved: CheckCircle2, settled: CheckCircle2 };
const statusColor: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  proposed: 'bg-blue-500/15 text-blue-700 border-blue-300',
  approved: 'bg-green-500/15 text-green-700 border-green-300',
  settled: 'bg-green-500/15 text-green-700 border-green-300',
};

export const NettingCyclesPanel = ({ cycles }: Props) => (
  <div className="space-y-4">
    {cycles.map(c => {
      const Icon = statusIcon[c.status] || Clock;
      return (
        <Card key={c.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{c.cycleName}</CardTitle>
              <Badge variant="outline" className={statusColor[c.status]}>{c.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Gross</span><p className="font-mono font-semibold">{fmt(c.totalGross)}</p></div>
              <div><span className="text-muted-foreground">Net</span><p className="font-mono font-semibold">{fmt(c.totalNet)}</p></div>
              <div><span className="text-muted-foreground">Savings</span><p className="font-mono font-semibold text-green-600">{c.savingsPct}%</p></div>
              <div><span className="text-muted-foreground">Pairs</span><p className="font-mono">{c.pairCount}</p></div>
            </div>
            {c.approvedBy && <p className="text-xs text-muted-foreground mt-2">Approved by {c.approvedBy}</p>}
            {c.status === 'proposed' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="default">Approve</Button>
                <Button size="sm" variant="outline">Review Details</Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    })}
  </div>
);

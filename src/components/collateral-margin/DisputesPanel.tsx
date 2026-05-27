import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import type { MarginRecon } from '@/hooks/useCollateralMargin';

interface Props {
  disputes: MarginRecon[];
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusColor: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive',
  submitted: 'bg-warning/10 text-warning',
  acknowledged: 'bg-info/10 text-info',
  resolved: 'bg-success/10 text-success',
  escalated: 'bg-destructive text-destructive-foreground',
};

export const DisputesPanel = ({ disputes }: Props) => (
  <div className="space-y-4">
    {disputes.length === 0 ? (
      <Card><CardContent className="py-12 text-center text-muted-foreground">No active disputes</CardContent></Card>
    ) : (
      disputes.map(d => (
        <Card key={d.id} className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {d.counterparty} — {d.nettingSet}
              </CardTitle>
              {d.disputeStatus && <Badge className={statusColor[d.disputeStatus]}>{d.disputeStatus}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Δ IM</p>
                <p className="font-semibold">{fmt(d.deltaIm)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Δ VM</p>
                <p className="font-semibold">{fmt(d.deltaVm)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Δ</p>
                <p className="font-bold text-destructive">{fmt(Math.abs(d.deltaIm) + Math.abs(d.deltaVm))}</p>
              </div>
            </div>
            {d.disputeReason && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-medium">Reason</span>
                </div>
                <p>{d.disputeReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))
    )}
  </div>
);

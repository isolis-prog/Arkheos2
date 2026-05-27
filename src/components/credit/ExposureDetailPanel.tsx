import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PauseCircle, AlertTriangle } from 'lucide-react';
import type { ExposureSnapshot, CreditLimit } from '@/hooks/useCreditExposure';

interface Props {
  snapshot: ExposureSnapshot | null;
  limit: CreditLimit | null;
  open: boolean;
  onClose: () => void;
}

const fmt = (n: number) => `$${(n / 1e6).toFixed(2)}M`;

export const ExposureDetailPanel = ({ snapshot, limit, open, onClose }: Props) => {
  if (!snapshot) return null;
  const util = snapshot.utilisationPct || 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${snapshot.trafficLight === 'red' ? 'bg-destructive' : snapshot.trafficLight === 'amber' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
            <SheetTitle>{snapshot.counterparty}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Recommended Action */}
          {snapshot.recommendedAction && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4 flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Recommended Action</p>
                  <p className="text-sm text-muted-foreground">{snapshot.recommendedAction}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Hold */}
          {snapshot.paymentHold && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4 flex gap-2 items-center">
                <PauseCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Payment Hold Active</span>
              </CardContent>
            </Card>
          )}

          {/* Utilisation */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Limit Utilisation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                <Progress value={Math.min(util, 100)} className={`h-3 flex-1 ${util > 100 ? '[&>div]:bg-destructive' : util >= 80 ? '[&>div]:bg-yellow-500' : ''}`} />
                <span className="text-lg font-bold font-mono">{util}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Net Exposure</span><p className="font-mono font-semibold">{fmt(snapshot.netExposure)}</p></div>
                <div><span className="text-muted-foreground">Limit</span><p className="font-mono">{snapshot.limitAmount ? fmt(snapshot.limitAmount) : '—'}</p></div>
                <div><span className="text-muted-foreground">Headroom</span><p className={`font-mono ${(snapshot.headroom || 0) < 0 ? 'text-destructive' : ''}`}>{snapshot.headroom != null ? fmt(snapshot.headroom) : '—'}</p></div>
                <div><span className="text-muted-foreground">DSO</span><p className="font-mono">{snapshot.dsoDays ?? '—'} days</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Exposure Breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Exposure Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'MTM Exposure', value: snapshot.mtmExposure, positive: true },
                { label: 'AR Outstanding', value: snapshot.arOutstanding, positive: true },
                { label: 'AP Outstanding', value: snapshot.apOutstanding, positive: false },
                { label: 'Collateral Offset', value: snapshot.collateralOffset, positive: false },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-mono ${r.positive ? '' : 'text-green-600'}`}>{r.positive ? '' : '('}{fmt(r.value)}{r.positive ? '' : ')'}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Net Exposure</span>
                <span className="font-mono">{fmt(snapshot.netExposure)}</span>
              </div>
            </CardContent>
          </Card>

          {/* AR Aging */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">AR Aging</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {[
                { label: 'Current', value: snapshot.arAging.current },
                { label: '30 days', value: snapshot.arAging.days30 },
                { label: '60 days', value: snapshot.arAging.days60, warn: true },
                { label: '90 days', value: snapshot.arAging.days90, warn: true },
                { label: '90+ days', value: snapshot.arAging.days90plus, warn: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-mono ${r.warn && r.value > 0 ? 'text-destructive' : ''}`}>{fmt(r.value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Overdue (&gt;60d)</span>
                <span className="font-mono text-destructive">{fmt(snapshot.arOverdue)}</span>
              </div>
              {snapshot.disputeAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Open Disputes</span>
                  <span className="font-mono">{fmt(snapshot.disputeAmount)}</span>
                </div>
              )}
              {snapshot.creditMemoAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Credit Memos</span>
                  <span className="font-mono">{fmt(snapshot.creditMemoAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limit Details */}
          {limit && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Limit & Guarantees</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Netting Set</span><span>{limit.nettingSet || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Collateral Held</span><span className="font-mono">{fmt(limit.collateralHeld)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Guarantee</span><span className="font-mono">{fmt(limit.guaranteeAmount)}</span></div>
                {limit.guaranteeProvider && <div className="flex justify-between"><span className="text-muted-foreground">Guarantee Provider</span><span>{limit.guaranteeProvider}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Approved By</span><span>{limit.approvedBy || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valid</span><span>{limit.validFrom} → {limit.validTo || '∞'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><Badge variant="outline">{snapshot.ownerRole}</Badge></div>
              </CardContent>
            </Card>
          )}

          {/* Sources */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Source Systems</CardTitle></CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {snapshot.sourceSystems.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

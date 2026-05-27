import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { LaytimeEvent } from '@/hooks/useLogisticsCosts';
import { format } from 'date-fns';
import { ArrowLeft, Anchor, Clock, AlertTriangle, CheckCircle, PauseCircle } from 'lucide-react';

interface Props {
  event: LaytimeEvent;
  onBack: () => void;
}

const statusConfig: Record<string, { color: string; icon: typeof Anchor }> = {
  in_progress: { color: 'bg-blue-500/10 text-blue-700 border-blue-300', icon: Clock },
  completed: { color: 'bg-green-500/10 text-green-700 border-green-300', icon: CheckCircle },
  on_demurrage: { color: 'bg-red-500/10 text-red-700 border-red-300', icon: AlertTriangle },
  on_despatch: { color: 'bg-primary/10 text-primary border-primary/30', icon: Anchor },
};

export const DemurrageCalculator = ({ event: e, onBack }: Props) => {
  const usedPct = Math.min((e.netHours / e.allowedHours) * 100, 150);
  const cfg = statusConfig[e.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h2 className="text-lg font-semibold">{e.vesselName} — {e.port}</h2>
        <Badge variant="outline" className={`ml-auto ${cfg.color}`}><StatusIcon className="h-3 w-3 mr-1" />{e.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Delivery', e.deliveryId], ['CP Ref', e.cpRef], ['Terminal', e.terminal],
          ['Arrival', format(new Date(e.arrivalDt), 'dd MMM HH:mm')],
          ['NOR Tendered', format(new Date(e.norTenderedDt), 'dd MMM HH:mm')],
          ['Commence', format(new Date(e.laytimeCommenceDt), 'dd MMM HH:mm')],
          ['Complete', e.laytimeCompleteDt ? format(new Date(e.laytimeCompleteDt), 'dd MMM HH:mm') : 'In progress'],
          ['Dem Rate', `$${e.demurrageRatePerDay.toLocaleString()}/day`],
        ].map(([label, val]) => (
          <div key={label as string}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{val}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Laytime Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time Used: <strong>{e.netHours}h</strong> / Allowed: <strong>{e.allowedHours}h</strong></span>
              <span className={e.overUnderHours > 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                {e.overUnderHours > 0 ? `+${e.overUnderHours}h over` : `${Math.abs(e.overUnderHours)}h under`}
              </span>
            </div>
            <Progress value={Math.min(usedPct, 100)} className="h-3" />
            {usedPct > 100 && (
              <div className="h-1 bg-destructive/20 rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: `${((usedPct - 100) / 50) * 100}%` }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Gross Hours</p>
              <p className="text-xl font-bold">{e.usedHours}h</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Stoppages Deducted</p>
              <p className="text-xl font-bold">{(e.usedHours - e.netHours).toFixed(1)}h</p>
            </div>
          </div>

          {e.stoppages.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1"><PauseCircle className="h-4 w-4" /> Stoppages ({e.stoppages.length})</p>
                <div className="space-y-2">
                  {e.stoppages.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span>{s.reason}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{format(new Date(s.startDt), 'dd MMM HH:mm')} → {format(new Date(s.endDt), 'HH:mm')}</span>
                        <Badge variant="secondary">{s.hours}h</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <Card className={e.demurrageAmount > 0 ? 'border-destructive/30' : ''}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Demurrage</p>
                <p className={`text-2xl font-bold ${e.demurrageAmount > 0 ? 'text-destructive' : ''}`}>
                  ${e.demurrageAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">@ ${e.demurrageRatePerDay.toLocaleString()}/day</p>
              </CardContent>
            </Card>
            <Card className={e.despatchAmount > 0 ? 'border-green-300' : ''}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Despatch</p>
                <p className={`text-2xl font-bold ${e.despatchAmount > 0 ? 'text-green-600' : ''}`}>
                  ${e.despatchAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">@ ${e.despatchRatePerDay.toLocaleString()}/day</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

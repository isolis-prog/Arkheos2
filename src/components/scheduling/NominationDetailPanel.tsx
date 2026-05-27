import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight, X } from 'lucide-react';
import { format } from 'date-fns';
import type { NominationLine, ScheduleEvent } from '@/hooks/useScheduling';

interface Props {
  line: NominationLine;
  events: ScheduleEvent[];
  onClose: () => void;
}

const eventIcon = (type: string) => {
  if (type.includes('change') || type === 'reroute') return <ArrowRight className="h-4 w-4 text-amber-500" />;
  if (type === 'confirmation') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (type === 'cancellation' || type === 'rejection') return <X className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-blue-500" />;
};

export const NominationDetailPanel = ({ line, events, onClose }: Props) => {
  const hasBreak = line.reconStatus === 'break';
  const reasons = line.reconResult.reasons ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {line.dealId} / {line.deliveryId}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Recon Result */}
      <Card className={hasBreak ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-500/5'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {hasBreak ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            Reconciliation Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant={hasBreak ? 'destructive' : 'default'}>{line.reconStatus.toUpperCase()}</Badge>
          {reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reasons.map((r) => (
                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
              ))}
            </div>
          )}
          {line.reconResult.qtyDelta != null && (
            <p className="text-sm text-muted-foreground">
              Qty delta: <span className="font-mono font-semibold">{line.reconResult.qtyDelta.toLocaleString()} {line.uom}</span>
              {line.reconResult.qtyDeltaPct != null && ` (${line.reconResult.qtyDeltaPct.toFixed(2)}%)`}
            </p>
          )}
          {line.reconResult.windowDeltaDays != null && (
            <p className="text-sm text-muted-foreground">
              Window delta: <span className="font-mono font-semibold">{line.reconResult.windowDeltaDays} day(s)</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Nomination vs ETRM</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Field</div>
            <div className="font-medium text-muted-foreground">Nomination</div>
            <div className="font-medium text-muted-foreground">ETRM</div>

            <div>Qty</div>
            <div className="font-mono">{line.qty.toLocaleString()} {line.uom}</div>
            <div className="font-mono">{line.etrmQty != null ? `${line.etrmQty.toLocaleString()} ${line.uom}` : '—'}</div>

            <div>Location</div>
            <div>{line.location}</div>
            <div>{line.etrmLocation ?? '—'}</div>

            <div>Start</div>
            <div>{format(new Date(line.startDt), 'dd MMM yyyy')}</div>
            <div>{line.etrmStartDt ? format(new Date(line.etrmStartDt), 'dd MMM yyyy') : '—'}</div>

            <div>End</div>
            <div>{format(new Date(line.endDt), 'dd MMM yyyy')}</div>
            <div>{line.etrmEndDt ? format(new Date(line.etrmEndDt), 'dd MMM yyyy') : '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Revision Timeline</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="mt-0.5">{eventIcon(ev.eventType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{ev.eventType.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(ev.createdAt), 'dd MMM HH:mm')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.actorName} — {ev.reason}</p>
                    {ev.oldValue && ev.newValue && (
                      <p className="text-xs font-mono mt-0.5">
                        {JSON.stringify(ev.oldValue)} → {JSON.stringify(ev.newValue)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <div className="flex gap-2">
        {hasBreak && (
          <>
            <Button size="sm" variant="destructive">Create Exception</Button>
            <Button size="sm" variant="outline">Resolve</Button>
          </>
        )}
        <Button size="sm" variant="outline" className="ml-auto">Export</Button>
      </div>
    </div>
  );
};

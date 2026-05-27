import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileText, GitBranch, History, Send, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ConfirmationTimelineProps {
  tradeConfirmationId: string;
  ourDocReceivedAt?: string | null;
  counterpartyDocReceivedAt?: string | null;
  matchedAt?: string | null;
  discrepancyCount?: number;
}

interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  detail?: string;
  type: 'capture' | 'sent' | 'received' | 'detected' | 'action' | 'settlement';
}

const ICONS: Record<TimelineEvent['type'], typeof FileText> = {
  capture: FileText,
  sent: Send,
  received: GitBranch,
  detected: ShieldAlert,
  action: History,
  settlement: CheckCircle2,
};

export function ConfirmationTimeline({
  tradeConfirmationId,
  ourDocReceivedAt,
  counterpartyDocReceivedAt,
  matchedAt,
  discrepancyCount = 0,
}: ConfirmationTimelineProps) {
  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['confirmations', 'timeline', tradeConfirmationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_events')
        .select('id, action, created_at, summary')
        .eq('entity_id', tradeConfirmationId)
        .eq('entity_type', 'trade_confirmation_status')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const events: TimelineEvent[] = [];
  if (ourDocReceivedAt) {
    events.push({
      id: 'capture',
      at: ourDocReceivedAt,
      label: 'Trade captured (our side)',
      type: 'capture',
    });
    events.push({
      id: 'sent',
      at: ourDocReceivedAt,
      label: 'Confirmation sent to counterparty',
      type: 'sent',
    });
  }
  if (counterpartyDocReceivedAt) {
    events.push({
      id: 'received',
      at: counterpartyDocReceivedAt,
      label: 'Counterparty confirmation received',
      type: 'received',
    });
  }
  if (discrepancyCount > 0) {
    events.push({
      id: 'detected',
      at: counterpartyDocReceivedAt ?? new Date().toISOString(),
      label: `${discrepancyCount} discrepanc${discrepancyCount === 1 ? 'y' : 'ies'} detected`,
      type: 'detected',
    });
  }
  (auditEvents ?? []).forEach((evt) => {
    events.push({
      id: evt.id,
      at: evt.created_at,
      label: evt.action.replace(/_/g, ' '),
      detail: evt.summary ?? undefined,
      type: 'action',
    });
  });
  if (matchedAt) {
    events.push({
      id: 'settled',
      at: matchedAt,
      label: 'Ready for settlement',
      type: 'settlement',
    });
  }

  events.sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Confirmation timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {events.map((evt) => {
              const Icon = ICONS[evt.type];
              return (
                <li key={evt.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-background',
                      evt.type === 'detected' && 'bg-destructive',
                      evt.type === 'settlement' && 'bg-success',
                      (evt.type === 'capture' || evt.type === 'sent' || evt.type === 'received' || evt.type === 'action') && 'bg-primary',
                    )}
                    aria-hidden
                  >
                    <Icon className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium capitalize text-foreground">{evt.label}</span>
                      <span className="text-xs text-muted-foreground">{new Date(evt.at).toLocaleString()}</span>
                    </div>
                    {evt.detail && <p className="mt-1 text-xs text-muted-foreground">{evt.detail}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

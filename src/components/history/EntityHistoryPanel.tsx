import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { History, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditEvents, type AuditEvent } from '@/hooks/useAuditEvents';

const ACTION_DOT: Record<string, string> = {
  CREATE: 'bg-emerald-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  SOFT_DELETE: 'bg-red-400',
  RUN: 'bg-purple-500',
  APPROVE: 'bg-emerald-500',
  REJECT: 'bg-orange-500',
  ASSIGN: 'bg-sky-500',
  RESOLVE: 'bg-teal-500',
  EXPORT: 'bg-gray-500',
};

interface EntityHistoryPanelProps {
  moduleKey: string;
  entityType: string;
  entityId: string;
  maxHeight?: string;
}

export function EntityHistoryPanel({ moduleKey, entityType, entityId, maxHeight = '400px' }: EntityHistoryPanelProps) {
  const { queryEvents } = useAuditEvents();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await queryEvents({ moduleKey, entityType, entityId, limit: 100 });
    setEvents(data);
    setLoading(false);
  }, [moduleKey, entityType, entityId, queryEvents]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-primary" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading history...</p>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No history recorded</p>
          ) : (
            <div className="relative space-y-0 border-l-2 border-border pl-4">
              {events.map((ev) => {
                const isExpanded = expandedId === ev.id;
                const hasDiff = ev.diff || ev.before_state || ev.after_state;
                return (
                  <div key={ev.id} className="relative pb-4">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${ACTION_DOT[ev.action] ?? 'bg-muted-foreground'}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase">{ev.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="mr-0.5 inline h-3 w-3" />
                            {format(new Date(ev.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm">{ev.summary ?? '—'}</p>
                      </div>
                      {hasDiff && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setExpandedId(isExpanded ? null : ev.id)}>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    {isExpanded && hasDiff && (
                      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
                        {JSON.stringify(ev.diff ?? { before: ev.before_state, after: ev.after_state }, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

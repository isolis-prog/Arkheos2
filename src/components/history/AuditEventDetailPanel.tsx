import { format } from 'date-fns';
import { Clock, User, Hash, Layers, FileText, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AuditEvent } from '@/hooks/useAuditEvents';

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

interface Props {
  event: AuditEvent;
}

export function AuditEventDetailPanel({ event }: Props) {
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-5 pr-4 pt-4">
        {/* Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Action:</span>
              <Badge variant="secondary">{event.action}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Entity:</span>
              <span>{event.entity_type}</span>
              {event.entity_id && <Badge variant="outline" className="font-mono text-xs">{event.entity_id}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Time:</span>
              <span>{format(new Date(event.created_at), 'PPpp')}</span>
            </div>
            {event.actor_id && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Actor:</span>
                <Badge variant="outline" className="font-mono text-xs">{event.actor_id}</Badge>
              </div>
            )}
            {event.correlation_id && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Correlation:</span>
                <span className="font-mono text-xs">{event.correlation_id}</span>
              </div>
            )}
            {event.summary && (
              <>
                <Separator />
                <p>{event.summary}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Diff / Before / After */}
        {event.diff && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Changes (Diff)</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonBlock label="" data={event.diff} />
            </CardContent>
          </Card>
        )}

        {(event.before_state || event.after_state) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                State Snapshots
                {event.before_state && event.after_state && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <JsonBlock label="Before" data={event.before_state} />
              <JsonBlock label="After" data={event.after_state} />
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonBlock label="" data={event.metadata} />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

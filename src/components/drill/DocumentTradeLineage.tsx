import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText, GitBranch, Rows3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentLineage } from '@/hooks/useDocumentLineage';
import { cn } from '@/lib/utils';
import { LineageEvidenceToggle } from './LineageEvidencePanel';

export interface DocumentTradeLineageProps {
  docId: string;
}

interface EdgeLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceType: 'document' | 'trade';
  sourceId: string;
  targetType: 'trade' | 'event';
  targetId: string;
}

export function DocumentTradeLineage({ docId }: DocumentTradeLineageProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useDocumentLineage(docId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<HTMLDivElement | null>(null);
  const tradeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = useState<EdgeLine[]>([]);
  const [hovered, setHovered] = useState<{ type: 'document' | 'trade' | 'event'; id: string } | null>(null);

  useLayoutEffect(() => {
    if (!data || !containerRef.current || !documentRef.current) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const docRect = documentRef.current.getBoundingClientRect();
    const nextEdges: EdgeLine[] = [];

    data.trades.forEach((trade) => {
      const tradeEl = tradeRefs.current[trade.dealId];
      if (!tradeEl) return;
      const tradeRect = tradeEl.getBoundingClientRect();
      nextEdges.push({
        id: `doc-${trade.dealId}`,
        x1: docRect.right - containerRect.left,
        y1: docRect.top - containerRect.top + docRect.height / 2,
        x2: tradeRect.left - containerRect.left,
        y2: tradeRect.top - containerRect.top + tradeRect.height / 2,
        sourceType: 'document',
        sourceId: data.document.id,
        targetType: 'trade',
        targetId: trade.dealId,
      });

      trade.events.forEach((event) => {
        const eventEl = eventRefs.current[event.id];
        if (!eventEl) return;
        const eventRect = eventEl.getBoundingClientRect();
        nextEdges.push({
          id: `trade-${trade.dealId}-${event.id}`,
          x1: tradeRect.right - containerRect.left,
          y1: tradeRect.top - containerRect.top + tradeRect.height / 2,
          x2: eventRect.left - containerRect.left,
          y2: eventRect.top - containerRect.top + eventRect.height / 2,
          sourceType: 'trade',
          sourceId: trade.dealId,
          targetType: 'event',
          targetId: event.id,
        });
      });
    });

    setEdges(nextEdges);
  }, [data]);

  const activeEdges = useMemo(() => {
    if (!hovered) return new Set<string>();
    return new Set(
      edges
        .filter((edge) => {
          if (hovered.type === 'document') return edge.sourceType === 'document';
          if (hovered.type === 'trade') return edge.sourceId === hovered.id || edge.targetId === hovered.id;
          return edge.targetId === hovered.id;
        })
        .map((edge) => edge.id),
    );
  }, [edges, hovered]);

  if (isLoading) {
    return <Skeleton className="h-[340px] w-full rounded-lg" />;
  }

  if (!data) {
    return <div className="rounded-lg border border-dashed bg-card p-8 text-sm text-muted-foreground">No lineage available for this document.</div>;
  }

  return (
    <ScrollArea className="rounded-lg border bg-card">
      <div ref={containerRef} className="relative min-w-[960px] p-6">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {edges.map((edge) => {
            const active = hovered ? activeEdges.has(edge.id) : false;
            return (
              <line
                key={edge.id}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={edge.targetType === 'event' ? '4 4' : undefined}
              />
            );
          })}
        </svg>

        <div className="grid grid-cols-[280px_minmax(280px,1fr)_minmax(320px,1.2fr)] gap-10">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Document</p>
            <Card
              ref={documentRef}
              className="rounded-md border-border transition-shadow hover:shadow-md"
              onMouseEnter={() => setHovered({ type: 'document', id: data.document.id })}
              onMouseLeave={() => setHovered(null)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="font-medium text-foreground">{data.document.title}</p>
                    <p className="text-sm text-muted-foreground">{data.document.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Trades</p>
            <div className="space-y-4">
              {data.trades.map((trade) => (
                <Card
                  key={trade.dealId}
                  ref={(node) => {
                    tradeRefs.current[trade.dealId] = node;
                  }}
                  className={cn(
                    'cursor-pointer rounded-md border-border transition-all hover:shadow-md',
                    hovered?.type === 'trade' && hovered.id === trade.dealId && 'ring-2 ring-primary',
                  )}
                  onMouseEnter={() => setHovered({ type: 'trade', id: trade.dealId })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => navigate(`/trade-explorer/${encodeURIComponent(trade.dealId)}?drillContext=${encodeURIComponent(JSON.stringify({ docId, source: 'document-lineage' }))}`)}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-info/10 p-2 text-info"><GitBranch className="h-4 w-4" /></div>
                      <div>
                        <p className="font-medium text-foreground">{trade.title}</p>
                        <p className="text-sm text-muted-foreground">{trade.subtitle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-mono text-foreground">{trade.quantity ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-mono text-foreground">{trade.price ?? '—'}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} onMouseEnter={(e) => e.stopPropagation()}>
                      <LineageEvidenceToggle lineage={trade.lineage} title="Link evidence" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Events</p>
            <div className="space-y-4">
              {data.trades.flatMap((trade) =>
                trade.events.map((event) => (
                  <Card
                    key={event.id}
                    ref={(node) => {
                      eventRefs.current[event.id] = node;
                    }}
                    className={cn(
                      'rounded-md border-border transition-shadow hover:shadow-md',
                      hovered?.type === 'event' && hovered.id === event.id && 'ring-2 ring-primary',
                    )}
                    onMouseEnter={() => setHovered({ type: 'event', id: event.id })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-secondary p-2 text-secondary-foreground"><Rows3 className="h-4 w-4" /></div>
                        <div>
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Trade</p>
                          <p className="font-mono text-foreground">{event.tradeId}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-mono text-foreground">{event.amount ?? '—'} {event.currency ?? ''}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTimeline } from '@/components/trade-explorer/EventTimeline';
import { AITradeSummary } from '@/components/ail/AITradeSummary';
import { useTradeDetail } from '@/hooks/useTradeExplorer';
import { useTradeReconciliationHistory } from '@/hooks/useTradeReconciliationHistory';
import { ReconciliationContextTab } from '@/components/trade/ReconciliationContextTab';
import { CashflowContextTab } from '@/components/trade/CashflowContextTab';
import { BreakStatusBadge } from '@/components/trade/BreakStatusBadge';
import { DrillProvider, useDrillContext } from '@/contexts/DrillContext';
import { DrillBreadcrumb, type DrillPathNode } from '@/components/drill';
import { withDrillContext } from '@/lib/drill-context-url';

const TRADE_TAB_OVERVIEW = 'overview';
const TRADE_TAB_RECONCILIATION = 'reconciliation';
const TRADE_TAB_CASHFLOW = 'cashflow';

function decodeDrillScope(encoded: string | null): Record<string, unknown> | null {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    const json = atob(padded);
    const decoded = decodeURIComponent(escape(json));
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    try {
      const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}

function buildDrillPath(scope: Record<string, unknown>, dealId: string): DrillPathNode[] {
  const runId = scope.runId as string | undefined;
  if (!runId) return [];

  const drillQuery = `?d=${encodeURIComponent(
    btoa(JSON.stringify(scope)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  )}`;

  const path: DrillPathNode[] = [
    { level: 0, label: 'Reconciliations', scope: {}, href: '/reconciliations' },
    { level: 1, label: `Run ${runId.slice(0, 8)}`, scope: { runId }, href: `/reconciliations/${runId}` },
    {
      level: 2,
      label: 'Breaks',
      scope: { runId },
      href: `/reconciliations/${runId}/breaks${drillQuery}`,
    },
  ];

  if (scope.legalEntityId) {
    path.push({
      level: 3,
      label: 'By entity',
      scope,
      href: `/reconciliations/${runId}/breaks/by-entity${drillQuery}`,
    });
  }
  if (scope.counterpartyId) {
    path.push({
      level: path.length,
      label: 'By counterparty',
      scope,
      href: `/reconciliations/${runId}/breaks/by-counterparty${drillQuery}`,
    });
  }
  path.push({
    level: path.length,
    label: 'Documents',
    scope,
    href: `/reconciliations/${runId}/breaks/documents${drillQuery}`,
  });
  if (scope.docId) {
    path.push({
      level: path.length,
      label: `Doc ${String(scope.docId).slice(0, 12)}`,
      scope,
      href: `/reconciliations/${runId}/breaks/documents/${encodeURIComponent(
        String(scope.docId),
      )}/trades${drillQuery}`,
    });
  }
  path.push({
    level: path.length,
    label: `Deal ${dealId}`,
    scope: { ...scope, dealId },
    href: `/trade-explorer/${encodeURIComponent(dealId)}${drillQuery}`,
  });

  return path.map((node, idx) => ({ ...node, level: idx }));
}

const TradeDetailInner = ({
  dealId,
  drillContextParam,
  hasDrillContext,
}: {
  dealId: string;
  drillContextParam: string | null;
  hasDrillContext: boolean;
}) => {
  const navigate = useNavigate();
  const { events, summary, isLoading } = useTradeDetail(dealId);
  const { data: reconHistory } = useTradeReconciliationHistory(dealId);
  const { path } = useDrillContext();
  const [activeTab, setActiveTab] = useState<string>(TRADE_TAB_OVERVIEW);
  const reconTabRef = useRef<HTMLButtonElement>(null);

  const handleBreadcrumbNavigate = (node: DrillPathNode) => {
    // Breadcrumb hrefs already include the drill token; pass through unchanged.
    navigate(node.href);
  };

  const handleBack = () => {
    if (hasDrillContext && path.length > 1) {
      const parent = path[path.length - 2];
      navigate(parent.href);
    } else {
      // No drill context — fall back to the trade explorer list, preserving
      // any drill token if one is somehow present in the URL.
      navigate(withDrillContext('/trade-explorer', drillContextParam));
    }
  };

  const formatCurrency = (amount: number, currency?: string | null) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const openBreaksCount = reconHistory.summary.currentlyOpenBreaks;

  const handleBreakBadgeClick = () => {
    setActiveTab(TRADE_TAB_RECONCILIATION);
    setTimeout(() => reconTabRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-6">
      {hasDrillContext && path.length > 0 && (
        <DrillBreadcrumb path={path} onNavigate={handleBreadcrumbNavigate} />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <PageHeader
              title={`Trade: ${dealId || 'Unknown'}`}
              description="View trade details and economic event timeline"
              className="mb-0"
            />
            <BreakStatusBadge
              openBreaksCount={openBreaksCount}
              onClick={handleBreakBadgeClick}
            />
          </div>
        </div>
        {dealId && summary && (
          <div className="ml-auto">
            <AITradeSummary
              dealId={dealId}
              tradeData={summary as unknown as Record<string, unknown>}
            />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value={TRADE_TAB_OVERVIEW}>Overview</TabsTrigger>
          <TabsTrigger value={TRADE_TAB_RECONCILIATION} ref={reconTabRef}>
            Reconciliation Context
            {openBreaksCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 font-mono">
                {openBreaksCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value={TRADE_TAB_CASHFLOW}>Cashflow Context</TabsTrigger>
        </TabsList>

        <TabsContent value={TRADE_TAB_OVERVIEW} className="space-y-6">
          {/* Trade Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Trade Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : summary ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <SummaryItem
                    icon={<Briefcase className="h-5 w-5 text-primary" />}
                    label="Strategy"
                    value={summary.strategy || '-'}
                  />
                  <SummaryItem
                    icon={<Building2 className="h-5 w-5 text-primary" />}
                    label="Counterparty"
                    value={summary.counterparty || '-'}
                  />
                  <SummaryItem
                    icon={<Calendar className="h-5 w-5 text-primary" />}
                    label="Events"
                    value={`${summary.eventCount} events`}
                  />
                  <SummaryItem
                    icon={<DollarSign className="h-5 w-5 text-primary" />}
                    label="Total Amount"
                    value={formatCurrency(summary.totalAmount, summary.currency)}
                    mono
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">Trade not found</p>
              )}

              {summary && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.bookPortfolio && (
                    <Badge variant="outline">Book: {summary.bookPortfolio}</Badge>
                  )}
                  {summary.legalEntity && (
                    <Badge variant="outline">Entity: {summary.legalEntity}</Badge>
                  )}
                  {summary.currency && <Badge variant="secondary">{summary.currency}</Badge>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Economic Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventTimeline events={events} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={TRADE_TAB_RECONCILIATION}>
          <ReconciliationContextTab dealId={dealId} drillContextParam={drillContextParam} />
        </TabsContent>

        <TabsContent value={TRADE_TAB_CASHFLOW}>
          {dealId ? (
            <CashflowContextTab dealId={dealId} />
          ) : (
            <p className="text-sm text-muted-foreground">No trade selected.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryItem = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
    <div className="p-2 rounded-md bg-primary/10">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? 'font-mono font-medium' : 'font-medium'}>{value}</p>
    </div>
  </div>
);

const TradeDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const decodedDealId = dealId ? decodeURIComponent(dealId) : '';
  const [searchParams] = useSearchParams();
  const drillContextParam = searchParams.get('drillContext') ?? searchParams.get('d');

  const initialPath = useMemo(() => {
    if (!drillContextParam || !decodedDealId) return undefined;
    const scope = decodeDrillScope(drillContextParam);
    if (!scope || !scope.runId) return undefined;
    return buildDrillPath(scope, decodedDealId);
  }, [drillContextParam, decodedDealId]);

  const initialScope = useMemo(() => {
    if (!drillContextParam) return undefined;
    return decodeDrillScope(drillContextParam) ?? undefined;
  }, [drillContextParam]);

  const hasDrillContext = Boolean(drillContextParam && initialPath && initialPath.length > 0);

  return (
    <DrillProvider
      module="reconciliations"
      path={initialPath}
      scope={initialScope}
    >
      <TradeDetailInner
        dealId={decodedDealId}
        drillContextParam={drillContextParam}
        hasDrillContext={hasDrillContext}
      />
    </DrillProvider>
  );
};

export default TradeDetail;

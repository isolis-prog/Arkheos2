import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Percent } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { PnLFilters } from '@/components/pnl-attribution/PnLFilters';
import { PnLDriverCards } from '@/components/pnl-attribution/PnLDriverCards';
import { PnLBridge } from '@/components/pnl-attribution/PnLBridge';
import { PnLByBookChart } from '@/components/pnl-attribution/PnLByBookChart';
import { TradePnLTable } from '@/components/pnl-attribution/TradePnLTable';
import { DailyFlashTable } from '@/components/pnl-attribution/DailyFlashTable';
import { FlashVsReconciledBar } from '@/components/pnl-attribution/FlashVsReconciledBar';
import { AIPnLExplanation } from '@/components/ail/AIPnLExplanation';
import { usePnLAttribution } from '@/hooks/usePnLAttribution';
import { useDailyPnLFlash } from '@/hooks/useDailyPnLFlash';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PnLAttribution = () => {
  const {
    tradePnL, summary, isLoading, filters, setFilters, filterOptions,
  } = usePnLAttribution();

  const flash = useDailyPnLFlash();

  const fmt = (value: number, showSign = true) => {
    const abs = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    if (abs >= 1_000_000) return `${showSign ? sign : ''}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${showSign ? sign : ''}$${(abs / 1_000).toFixed(0)}K`;
    return `${showSign ? sign : ''}$${abs.toFixed(0)}`;
  };

  const previousTotal = tradePnL.reduce((sum, t) => sum + t.previousAmount, 0);
  const currentTotal = tradePnL.reduce((sum, t) => sum + t.currentAmount, 0);
  const isPositive = summary.totalPnL >= 0;
  const topDriver = summary.byDriver.length > 0
    ? [...summary.byDriver].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
    : null;

    return (
      <div className="space-y-6">
        <PageHeader
          title="PnL Explain & Attribution"
          description="Explain PnL movements across FO / MO / Finance by price, basis, spread, FX, volume, fees, new deals, and model changes"
          actions={
            <AIPnLExplanation
              pnlData={{ totalPnL: summary.totalPnL, realizedPnL: summary.realizedPnL, unrealizedPnL: summary.unrealizedPnL, byDriver: summary.byDriver }}
            />
          }
        />

      <Tabs defaultValue="attribution" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attribution">P&L Attribution</TabsTrigger>
          <TabsTrigger value="daily-flash">Daily P&L Flash</TabsTrigger>
        </TabsList>

        <TabsContent value="attribution" className="space-y-6">
          {/* Summary metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <MetricCard title="T-1 Value" value={fmt(previousTotal, false)} icon={DollarSign} subtitle="Previous snapshot" isLoading={isLoading} />
            <MetricCard title="T Value" value={fmt(currentTotal, false)} icon={DollarSign} subtitle="Current snapshot" isLoading={isLoading} />
            <MetricCard
              title="Total PnL"
              value={fmt(summary.totalPnL)}
              icon={isPositive ? TrendingUp : TrendingDown}
              subtitle={`Realized: ${fmt(summary.realizedPnL)} | Unreal: ${fmt(summary.unrealizedPnL)}`}
              variant={isPositive ? 'success' : 'error'}
              isLoading={isLoading}
            />
            <MetricCard
              title="Unexplained %"
              value={`${summary.unexplainedPct.toFixed(1)}%`}
              icon={Percent}
              subtitle={summary.unexplainedPct > 5 ? 'Above threshold' : 'Within tolerance'}
              variant={summary.unexplainedPct > 5 ? 'warning' : 'success'}
              isLoading={isLoading}
            />
            <MetricCard title="Top Driver" value={topDriver?.label ?? '-'} icon={TrendingUp} subtitle={topDriver ? fmt(topDriver.amount) : ''} isLoading={isLoading} />
            <MetricCard
              title="Exception Links"
              value={tradePnL.filter(t => t.linkedExceptionId).length}
              icon={AlertTriangle}
              subtitle="Trades with breaks"
              variant={tradePnL.filter(t => t.linkedExceptionId).length > 0 ? 'warning' : 'default'}
              isLoading={isLoading}
            />
          </div>

          {/* Driver breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-3">PnL by Driver</h3>
            <PnLDriverCards drivers={summary.byDriver} isLoading={isLoading} />
          </div>

          {/* Portfolio hierarchy summary */}
          {summary.byPortfolio.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Portfolio Hierarchy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {summary.byPortfolio.slice(0, 8).map((p) => (
                    <div key={p.portfolio} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{p.portfolio}</p>
                        <p className="text-xs text-muted-foreground">{p.bookCount} books</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${p.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {fmt(p.pnl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PnLBridge summary={summary} previousTotal={previousTotal} isLoading={isLoading} />
            <PnLByBookChart data={summary.byBook} isLoading={isLoading} />
          </div>

          {/* Trade-level drill-down */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Trade-Level PnL Breakdown
                {tradePnL.filter(t => t.linkedExceptionId).length > 0 && (
                  <Badge variant="outline" className="text-xs border-warning text-warning ml-2">
                    {tradePnL.filter(t => t.linkedExceptionId).length} linked exceptions
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PnLFilters filters={filters} onFiltersChange={setFilters} filterOptions={filterOptions} />
              <TradePnLTable trades={tradePnL} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-flash" className="space-y-6">
          {/* Flash KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Flash Total P&L"
              value={fmt(flash.todayTotal)}
              icon={flash.todayTotal >= 0 ? TrendingUp : TrendingDown}
              subtitle="Across all desks"
              variant={flash.todayTotal >= 0 ? 'success' : 'error'}
            />
            <MetricCard
              title="Day Change"
              value={fmt(flash.totalDayChange)}
              icon={flash.totalDayChange >= 0 ? TrendingUp : TrendingDown}
              subtitle={`${flash.deltaPct >= 0 ? '+' : ''}${flash.deltaPct.toFixed(1)}% vs yesterday`}
              variant={flash.totalDayChange >= 0 ? 'success' : 'error'}
            />
            <MetricCard
              title="Desks Tracked"
              value={flash.flashData.length}
              icon={DollarSign}
              subtitle="Active desks"
            />
            <MetricCard
              title="MO Variances"
              value={flash.flashData.filter(d => d.moVariance !== null && Math.abs(d.moVariance) > flash.varianceThreshold).length}
              icon={AlertTriangle}
              subtitle={`Threshold: $${(flash.varianceThreshold / 1000).toFixed(0)}K`}
              variant={flash.flashData.filter(d => d.moVariance !== null && Math.abs(d.moVariance) > flash.varianceThreshold).length > 0 ? 'warning' : 'default'}
            />
          </div>

          {/* Comparison bar */}
          <FlashVsReconciledBar
            yesterdayTotal={flash.yesterdayTotal}
            todayTotal={flash.todayTotal}
            totalDayChange={flash.totalDayChange}
            deltaPct={flash.deltaPct}
          />

          {/* Flash table with drill-down */}
          <DailyFlashTable
            data={flash.flashData}
            expandedDesk={flash.expandedDesk}
            onToggleDesk={(id) => flash.setExpandedDesk(flash.expandedDesk === id ? null : id)}
            varianceThreshold={flash.varianceThreshold}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PnLAttribution;

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketAnalyticsKPIs } from '@/components/market-analytics/MarketAnalyticsKPIs';
import { FundamentalsTab } from '@/components/market-analytics/FundamentalsTab';
import { SpreadBasisTab } from '@/components/market-analytics/SpreadBasisTab';
import { FlowLogTab } from '@/components/market-analytics/FlowLogTab';
import { WeatherTab } from '@/components/market-analytics/WeatherTab';
import { MacroTab } from '@/components/market-analytics/MacroTab';
import { WatchlistTab } from '@/components/market-analytics/WatchlistTab';
import { useMarketAnalytics } from '@/hooks/useMarketAnalytics';
import { BarChart3 } from 'lucide-react';

const MarketAnalytics = () => {
  const {
    activeTab, setActiveTab,
    fundamentals, spreads, spreadHistory,
    flows, weather, macro, watchlist, kpis,
  } = useMarketAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Supply/demand fundamentals, spreads, flows, weather & macro context
          </p>
        </div>
      </div>

      <MarketAnalyticsKPIs {...kpis} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="spreads">Spreads & Basis</TabsTrigger>
          <TabsTrigger value="flows">Flow Log</TabsTrigger>
          <TabsTrigger value="weather">Weather & Demand</TabsTrigger>
          <TabsTrigger value="macro">Macro</TabsTrigger>
          <TabsTrigger value="watchlist">My Watchlist</TabsTrigger>
        </TabsList>
        <TabsContent value="fundamentals"><FundamentalsTab data={fundamentals} /></TabsContent>
        <TabsContent value="spreads"><SpreadBasisTab spreads={spreads} history={spreadHistory} /></TabsContent>
        <TabsContent value="flows"><FlowLogTab flows={flows} /></TabsContent>
        <TabsContent value="weather"><WeatherTab signals={weather} /></TabsContent>
        <TabsContent value="macro"><MacroTab data={macro} /></TabsContent>
        <TabsContent value="watchlist"><WatchlistTab items={watchlist} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketAnalytics;

import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketDataControls } from '@/hooks/useMarketDataControls';
import { IPVKPIs } from '@/components/market-data-controls/IPVKPIs';
import { IPVFilters } from '@/components/market-data-controls/IPVFilters';
import { PricePointsTable } from '@/components/market-data-controls/PricePointsTable';
import { TopOffendersChart } from '@/components/market-data-controls/TopOffendersChart';
import { ToleranceConfigsTable } from '@/components/market-data-controls/ToleranceConfigsTable';

const MarketDataControlsLite = () => {
  const mdc = useMarketDataControls();

  return (
    <div className="space-y-6">
      <PageHeader title="Market Data Controls (IPV Lite)" description="Vendor feed vs ETRM snapshot — tolerance checks, spike detection, and close freeze" />
      <IPVKPIs stats={mdc.stats} />
      <Tabs defaultValue="prices">
        <TabsList>
          <TabsTrigger value="prices">Price Points ({mdc.filtered.length})</TabsTrigger>
          <TabsTrigger value="offenders">Top Offenders</TabsTrigger>
          <TabsTrigger value="config">Tolerances</TabsTrigger>
        </TabsList>
        <TabsContent value="prices" className="space-y-4">
          <IPVFilters
            indexFilter={mdc.indexFilter} setIndexFilter={mdc.setIndexFilter}
            dateFilter={mdc.dateFilter} setDateFilter={mdc.setDateFilter}
            statusFilter={mdc.statusFilter} setStatusFilter={mdc.setStatusFilter}
            searchQuery={mdc.searchQuery} setSearchQuery={mdc.setSearchQuery}
            indices={mdc.indices} dates={mdc.dates}
          />
          <PricePointsTable points={mdc.filtered} />
        </TabsContent>
        <TabsContent value="offenders">
          <TopOffendersChart offenders={mdc.topOffenders} />
        </TabsContent>
        <TabsContent value="config">
          <ToleranceConfigsTable configs={mdc.configs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketDataControlsLite;

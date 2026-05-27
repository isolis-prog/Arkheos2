import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOpsActuals } from '@/hooks/useOpsActuals';
import { OpsActualsKPIs } from '@/components/ops-actuals/OpsActualsKPIs';
import { OpsActualsFilters } from '@/components/ops-actuals/OpsActualsFilters';
import { WaterfallChart } from '@/components/ops-actuals/WaterfallChart';
import { FlowsTable } from '@/components/ops-actuals/FlowsTable';

const OpsActualsLite = () => {
  const ops = useOpsActuals();

  return (
    <div className="space-y-6">
      <PageHeader title="Ops Actuals" description="Planned vs Nominated vs Scheduled vs Actual volumes by location" />
      <OpsActualsKPIs stats={ops.stats} />
      <Tabs defaultValue="waterfall">
        <TabsList>
          <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
          <TabsTrigger value="daily">Daily Flows ({ops.filtered.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="waterfall">
          <WaterfallChart waterfall={ops.waterfall} />
        </TabsContent>
        <TabsContent value="daily" className="space-y-4">
          <OpsActualsFilters
            locationFilter={ops.locationFilter} setLocationFilter={ops.setLocationFilter}
            statusFilter={ops.statusFilter} setStatusFilter={ops.setStatusFilter}
            searchQuery={ops.searchQuery} setSearchQuery={ops.setSearchQuery}
            locations={ops.locations}
          />
          <FlowsTable flows={ops.filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpsActualsLite;

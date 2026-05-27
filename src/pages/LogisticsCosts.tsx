import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogCostKPIs } from '@/components/logistics-costs/LogCostKPIs';
import { LogCostFilters } from '@/components/logistics-costs/LogCostFilters';
import { CostReconTable } from '@/components/logistics-costs/CostReconTable';
import { LaytimeTable } from '@/components/logistics-costs/LaytimeTable';
import { DemurrageCalculator } from '@/components/logistics-costs/DemurrageCalculator';
import { TopLanesOverruns } from '@/components/logistics-costs/TopLanesOverruns';
import { useLogisticsCosts } from '@/hooks/useLogisticsCosts';
import { toast } from 'sonner';

const LogisticsCostsPage = () => {
  const lc = useLogisticsCosts();

  if (lc.selectedLaytime) {
    return (
      <div className="space-y-6">
        <PageHeader title="Logistics Costs" description="Demurrage calculator" />
        <DemurrageCalculator event={lc.selectedLaytime} onBack={() => lc.setSelectedLaytimeId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Logistics Costs" description="Freight, demurrage, storage & terminal fee reconciliation" />
      <LogCostKPIs kpis={lc.kpis} />

      <Tabs value={lc.activeTab} onValueChange={(v) => lc.setActiveTab(v as typeof lc.activeTab)}>
        <TabsList>
          <TabsTrigger value="costs">Cost Recon ({lc.filteredRecons.length})</TabsTrigger>
          <TabsTrigger value="demurrage">Demurrage ({lc.laytimeEvents.length})</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({lc.disputes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-4">
          <LogCostFilters
            costTypeFilter={lc.costTypeFilter} setCostTypeFilter={lc.setCostTypeFilter}
            statusFilter={lc.statusFilter} setStatusFilter={lc.setStatusFilter}
            searchQuery={lc.searchQuery} setSearchQuery={lc.setSearchQuery}
          />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <CostReconTable
                recons={lc.filteredRecons}
                onSelect={lc.setSelectedReconId}
                onOpenDispute={(id) => toast.success(`Dispute opened for ${id}`)}
              />
            </div>
            <TopLanesOverruns lanes={lc.kpis.topLanes} />
          </div>
        </TabsContent>

        <TabsContent value="demurrage">
          <LaytimeTable events={lc.laytimeEvents} onSelect={lc.setSelectedLaytimeId} />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <CostReconTable
            recons={lc.disputes}
            onSelect={lc.setSelectedReconId}
            onOpenDispute={(id) => toast.info(`Dispute already open for ${id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogisticsCostsPage;

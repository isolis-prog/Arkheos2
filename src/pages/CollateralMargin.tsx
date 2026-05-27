import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollateralMargin } from '@/hooks/useCollateralMargin';
import { MarginKPIs } from '@/components/collateral-margin/MarginKPIs';
import { MarginFilters } from '@/components/collateral-margin/MarginFilters';
import { StatementsTable } from '@/components/collateral-margin/StatementsTable';
import { ReconTable } from '@/components/collateral-margin/ReconTable';
import { DisputesPanel } from '@/components/collateral-margin/DisputesPanel';
import { CollateralTable } from '@/components/collateral-margin/CollateralTable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const CollateralMargin = () => {
  const {
    statements, collateral, recons, disputes, kpis, counterparties,
    counterpartyFilter, setCounterpartyFilter,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    activeTab, setActiveTab,
  } = useCollateralMargin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collateral & Margin"
        description="Reconcile margin statements (IM/VM), collateral balances, and GL tie-out"
        actions={<Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      <MarginKPIs kpis={kpis} />

      <MarginFilters
        counterparties={counterparties}
        counterpartyFilter={counterpartyFilter}
        setCounterpartyFilter={setCounterpartyFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Margin Statements</TabsTrigger>
          <TabsTrigger value="recon">Recon Results</TabsTrigger>
          <TabsTrigger value="collateral">Collateral Balances</TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes
            {disputes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                {disputes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><StatementsTable data={statements} /></TabsContent>
        <TabsContent value="recon"><ReconTable data={recons} /></TabsContent>
        <TabsContent value="collateral"><CollateralTable data={collateral} /></TabsContent>
        <TabsContent value="disputes"><DisputesPanel disputes={disputes} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CollateralMargin;

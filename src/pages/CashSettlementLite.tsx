import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCashSettlement } from '@/hooks/useCashSettlement';
import { CashSettlementKPIs } from '@/components/cash-settlement/CashSettlementKPIs';
import { CashSettlementFilters } from '@/components/cash-settlement/CashSettlementFilters';
import { MatchWorkbench } from '@/components/cash-settlement/MatchWorkbench';
import { UnmatchedTxnsTable } from '@/components/cash-settlement/UnmatchedTxnsTable';

const CashSettlementLite = () => {
  const cs = useCashSettlement();

  return (
    <div className="space-y-6">
      <PageHeader title="Cash Application Workbench" description="Match ERP invoices to bank transactions — accept, reject, or split payments" />
      <CashSettlementKPIs stats={cs.stats} />
      <Tabs defaultValue="workbench">
        <TabsList>
          <TabsTrigger value="workbench">Match Workbench ({cs.filteredMatches.length})</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched ({cs.unmatchedTxns.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="workbench" className="space-y-4">
          <CashSettlementFilters
            statusFilter={cs.statusFilter} setStatusFilter={cs.setStatusFilter}
            exceptionFilter={cs.exceptionFilter} setExceptionFilter={cs.setExceptionFilter}
            searchQuery={cs.searchQuery} setSearchQuery={cs.setSearchQuery}
          />
          <MatchWorkbench matches={cs.filteredMatches} />
        </TabsContent>
        <TabsContent value="unmatched">
          <UnmatchedTxnsTable txns={cs.unmatchedTxns} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashSettlementLite;

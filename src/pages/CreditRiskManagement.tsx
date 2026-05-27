import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreditRiskManagement } from '@/hooks/useCreditRiskManagement';
import { CreditRiskKPIs } from '@/components/credit-risk/CreditRiskKPIs';
import { CreditFilesTab } from '@/components/credit-risk/CreditFilesTab';
import { CreditLineMonitorTab } from '@/components/credit-risk/CreditLineMonitorTab';
import { MarginCallsTab } from '@/components/credit-risk/MarginCallsTab';
import { WrongWayRiskTab } from '@/components/credit-risk/WrongWayRiskTab';
import { CreditReviewQueueTab } from '@/components/credit-risk/CreditReviewQueueTab';

const CreditRiskManagement = () => {
  const crm = useCreditRiskManagement();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Risk Management"
        description="Counterparty credit lifecycle, line monitoring, margin calls & wrong-way risk"
      />

      <CreditRiskKPIs kpis={crm.kpis} />

      <Tabs value={crm.activeTab} onValueChange={crm.setActiveTab}>
        <TabsList>
          <TabsTrigger value="credit-files">Credit Files ({crm.creditFiles.length})</TabsTrigger>
          <TabsTrigger value="line-monitor">Line Monitor</TabsTrigger>
          <TabsTrigger value="margin-calls">Margin Calls ({crm.marginCalls.length})</TabsTrigger>
          <TabsTrigger value="wrong-way">Wrong-Way Risk ({crm.wrongWayFlags.length})</TabsTrigger>
          <TabsTrigger value="review-queue">Review Queue ({crm.reviewQueue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="credit-files">
          <CreditFilesTab
            files={crm.creditFiles}
            statusFilter={crm.statusFilter}
            setStatusFilter={crm.setStatusFilter}
            searchQuery={crm.searchQuery}
            setSearchQuery={crm.setSearchQuery}
          />
        </TabsContent>

        <TabsContent value="line-monitor">
          <CreditLineMonitorTab files={crm.allCreditFiles} />
        </TabsContent>

        <TabsContent value="margin-calls">
          <MarginCallsTab calls={crm.marginCalls} />
        </TabsContent>

        <TabsContent value="wrong-way">
          <WrongWayRiskTab flags={crm.wrongWayFlags} />
        </TabsContent>

        <TabsContent value="review-queue">
          <CreditReviewQueueTab queue={crm.reviewQueue} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditRiskManagement;

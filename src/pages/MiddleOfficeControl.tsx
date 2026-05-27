import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMiddleOfficeControl } from '@/hooks/useMiddleOfficeControl';
import { MOControlKPIs } from '@/components/middle-office/MOControlKPIs';
import { DealReviewTab } from '@/components/middle-office/DealReviewTab';
import { DailyPnLTab } from '@/components/middle-office/DailyPnLTab';
import { IPVTab } from '@/components/middle-office/IPVTab';
import { BreachWorkflowTab } from '@/components/middle-office/BreachWorkflowTab';
import { ExposureDashboardTab } from '@/components/middle-office/ExposureDashboardTab';

export default function MiddleOfficeControl() {
  const {
    activeTab, setActiveTab,
    reviewFilter, setReviewFilter,
    pnlDateFilter, setPnlDateFilter,
    filteredReviews, filteredPnL,
    breachResponses, signoffs, ipvPositions,
    pendingReviews, openBreaches, desksSignedOff, totalDesks, totalIPVReserve,
  } = useMiddleOfficeControl();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Middle Office Control"
        description="Independent deal review, P&L validation, IPV governance, breach workflow & daily exposure sign-off"
      />

      <MOControlKPIs
        pendingReviews={pendingReviews}
        openBreaches={openBreaches}
        desksSignedOff={desksSignedOff}
        totalDesks={totalDesks}
        totalIPVReserve={totalIPVReserve}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="deal-review">Deal Review</TabsTrigger>
          <TabsTrigger value="daily-pnl">Daily P&L</TabsTrigger>
          <TabsTrigger value="ipv">IPV</TabsTrigger>
          <TabsTrigger value="breach-workflow">Breach Workflow</TabsTrigger>
          <TabsTrigger value="exposure">Exposure Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="deal-review">
          <DealReviewTab data={filteredReviews} filter={reviewFilter} onFilterChange={setReviewFilter} />
        </TabsContent>
        <TabsContent value="daily-pnl">
          <DailyPnLTab data={filteredPnL} dateFilter={pnlDateFilter} onDateChange={setPnlDateFilter} />
        </TabsContent>
        <TabsContent value="ipv">
          <IPVTab data={ipvPositions} totalReserve={totalIPVReserve} />
        </TabsContent>
        <TabsContent value="breach-workflow">
          <BreachWorkflowTab data={breachResponses} />
        </TabsContent>
        <TabsContent value="exposure">
          <ExposureDashboardTab data={signoffs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

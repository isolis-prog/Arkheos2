import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradeFinance } from '@/hooks/useTradeFinance';
import { TradeFinanceKPIs } from '@/components/trade-finance/TradeFinanceKPIs';
import { LCRegisterTab } from '@/components/trade-finance/LCRegisterTab';
import { BorrowingBaseTab } from '@/components/trade-finance/BorrowingBaseTab';
import { PreExportFinanceTab } from '@/components/trade-finance/PreExportFinanceTab';
import { TradeFinanceCalendarTab } from '@/components/trade-finance/TradeFinanceCalendarTab';

export default function TradeFinancePage() {
  const {
    activeTab, setActiveTab,
    lcFilter, setLcFilter,
    financeTypeFilter, setFinanceTypeFilter,
    filteredLCs, facilities, filteredFinance, calendarEvents,
    totalLCExposure, totalFacilityDrawn, totalOutstandingFinance,
  } = useTradeFinance();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Trade Finance"
        description="Letters of credit, borrowing base facilities, pre-export & receivables finance"
      />

      <TradeFinanceKPIs
        totalLCExposure={totalLCExposure}
        totalFacilityDrawn={totalFacilityDrawn}
        totalOutstandingFinance={totalOutstandingFinance}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="lc-register">LC Register</TabsTrigger>
          <TabsTrigger value="sblc-register">Standby LCs</TabsTrigger>
          <TabsTrigger value="borrowing-base">Borrowing Base</TabsTrigger>
          <TabsTrigger value="financing">Pre-Export / Receivables</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="lc-register">
          <LCRegisterTab data={filteredLCs} filter={lcFilter} onFilterChange={setLcFilter} />
        </TabsContent>
        <TabsContent value="sblc-register">
          <LCRegisterTab data={filteredLCs} filter={lcFilter} onFilterChange={setLcFilter} isStandby />
        </TabsContent>
        <TabsContent value="borrowing-base">
          <BorrowingBaseTab facilities={facilities} />
        </TabsContent>
        <TabsContent value="financing">
          <PreExportFinanceTab data={filteredFinance} filter={financeTypeFilter} onFilterChange={setFinanceTypeFilter} />
        </TabsContent>
        <TabsContent value="calendar">
          <TradeFinanceCalendarTab events={calendarEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

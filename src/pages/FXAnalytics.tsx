import { PageHeader } from '@/components/ui/page-header';
import { FXFilters } from '@/components/fx-analytics/FXFilters';
import { FXExposureCards } from '@/components/fx-analytics/FXExposureCards';
import { FXByCurrencyChart } from '@/components/fx-analytics/FXByCurrencyChart';
import { FXByEntityTable } from '@/components/fx-analytics/FXByEntityTable';
import { FXTimeBuckets } from '@/components/fx-analytics/FXTimeBuckets';
import { CashManagementTab } from '@/components/fx-analytics/CashManagementTab';
import { MarginLiquidityTab } from '@/components/fx-analytics/MarginLiquidityTab';
import { CreditFacilityTab } from '@/components/fx-analytics/CreditFacilityTab';
import { FXFundingTab } from '@/components/fx-analytics/FXFundingTab';
import { useFXAnalytics } from '@/hooks/useFXAnalytics';
import { useFXTreasury } from '@/hooks/useFXTreasury';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FXAnalytics = () => {
  const {
    exposures,
    timeBuckets,
    summary,
    filters,
    setFilters,
    legalEntities,
    currencyPairs,
    isLoading,
  } = useFXAnalytics();

  const treasury = useFXTreasury();

  return (
    <div className="space-y-6">
      <PageHeader
        title="FX & Treasury Analytics"
        description="Centralized view of FX exposure, realized vs unrealized P&L, hedge effectiveness, cash management, and credit facilities"
      />

      <Tabs defaultValue="fx-overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="fx-overview">FX Overview</TabsTrigger>
          <TabsTrigger value="cash-management">Cash Management</TabsTrigger>
          <TabsTrigger value="margin-liquidity">Margin Liquidity</TabsTrigger>
          <TabsTrigger value="credit-facilities">Credit Facilities</TabsTrigger>
          <TabsTrigger value="fx-funding">FX Funding</TabsTrigger>
        </TabsList>

        <TabsContent value="fx-overview" className="space-y-6">
          <FXFilters
            filters={filters}
            onFiltersChange={setFilters}
            legalEntities={legalEntities}
            currencyPairs={currencyPairs}
          />

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-[350px]" />
            </div>
          ) : (
            <>
              <FXExposureCards summary={summary} />

              <div className="grid gap-6 lg:grid-cols-2">
                <FXByCurrencyChart exposures={exposures} />
                <FXByEntityTable exposures={exposures} />
              </div>

              <FXTimeBuckets timeBuckets={timeBuckets} bucketType={filters.timeBucket} />
            </>
          )}
        </TabsContent>

        <TabsContent value="cash-management">
          <CashManagementTab
            accounts={treasury.bankAccounts}
            totalCashByCurrency={treasury.totalCashByCurrency}
            totalCashUsd={treasury.totalCashUsd}
            totalAvailableUsd={treasury.totalAvailableUsd}
            bankConcentration={treasury.bankConcentration}
          />
        </TabsContent>

        <TabsContent value="margin-liquidity">
          <MarginLiquidityTab
            positions={treasury.marginPositions}
            totalCurrent={treasury.totalMarginCurrent}
            totalUp5={treasury.totalMarginUp5}
            totalDown5={treasury.totalMarginDown5}
            worstCase={treasury.worstCaseMargin}
            availableCash={treasury.totalAvailableUsd}
            coverageRatio={treasury.marginCoverageRatio}
          />
        </TabsContent>

        <TabsContent value="credit-facilities">
          <CreditFacilityTab
            facilities={treasury.creditFacilities}
            totalLimit={treasury.totalFacilityLimit}
            totalDrawn={treasury.totalDrawn}
            totalHeadroom={treasury.totalHeadroom}
          />
        </TabsContent>

        <TabsContent value="fx-funding">
          <FXFundingTab gaps={treasury.fxFundingGaps} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FXAnalytics;

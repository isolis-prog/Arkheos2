import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCashflows, BucketFilter } from '@/hooks/useCashflows';
import { LiquidityOutlook } from '@/components/cashflows/LiquidityOutlook';
import { CashflowRegister } from '@/components/cashflows/CashflowRegister';
import { RiskConcentration } from '@/components/cashflows/RiskConcentration';
import { CashflowExceptions } from '@/components/cashflows/CashflowExceptions';
import { CashflowSettings } from '@/components/cashflows/CashflowSettings';

const Cashflows = () => {
  const [bucket, setBucket] = useState<BucketFilter>('D30');
  const data = useCashflows(bucket);

  return (
    <div>
      <PageHeader
        title="Cashflows"
        description="Liquidity outlook with ETRM + ERP consolidated projections"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Horizon:</span>
            <Select value={bucket} onValueChange={v => setBucket(v as BucketFilter)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="D30">30 Days</SelectItem>
                <SelectItem value="D45">45 Days</SelectItem>
                <SelectItem value="D60">60 Days</SelectItem>
                <SelectItem value="D90">90 Days</SelectItem>
                <SelectItem value="D120">120 Days</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs defaultValue="outlook" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outlook">Liquidity Outlook</TabsTrigger>
          <TabsTrigger value="register">Cashflow Register</TabsTrigger>
          <TabsTrigger value="risk">Risk & Concentration</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions & Controls</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="outlook">
          <LiquidityOutlook
            totalInflows={data.totalInflows}
            totalOutflows={data.totalOutflows}
            netCash={data.netCash}
            overdueAmount={data.overdueAmount}
            topInflows={data.topInflows}
            topOutflows={data.topOutflows}
            chartData={data.chartData}
            isLoading={data.isLoading}
          />
        </TabsContent>

        <TabsContent value="register">
          <CashflowRegister
            consolidated={data.consolidated}
            events={data.events}
            isLoading={data.isLoading}
          />
        </TabsContent>

        <TabsContent value="risk">
          <RiskConcentration
            concentrationByCounterparty={data.concentrationByCounterparty}
            concentrationByCurrency={data.concentrationByCurrency}
            concentrationByEntity={data.concentrationByEntity}
            consolidated={data.consolidated}
            ruleset={data.ruleset}
          />
        </TabsContent>

        <TabsContent value="exceptions">
          <CashflowExceptions exceptions={data.exceptions} />
        </TabsContent>

        <TabsContent value="settings">
          <CashflowSettings ruleset={data.ruleset} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cashflows;

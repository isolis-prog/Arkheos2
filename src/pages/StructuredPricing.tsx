import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStructuredPricing } from '@/hooks/useStructuredPricing';
import { OptionPricerTab } from '@/components/structured-pricing/OptionPricerTab';
import { VolSurfaceTab } from '@/components/structured-pricing/VolSurfaceTab';
import { GreeksDashboardTab } from '@/components/structured-pricing/GreeksDashboardTab';
import { ScenarioAnalysisTab } from '@/components/structured-pricing/ScenarioAnalysisTab';
import { StructuredDealTab } from '@/components/structured-pricing/StructuredDealTab';

export default function StructuredPricing() {
  const {
    activeTab, setActiveTab,
    volCommodity, setVolCommodity,
    pricerForm, setPricerForm, pricerResult, runPricer,
    filteredVolSurface, pricingRuns,
    greeks, scenarios, priceShocks, volShocks,
    quotes,
  } = useStructuredPricing();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Structured Pricing & Analytics"
        description="Option pricing (Black-76), volatility surfaces, portfolio Greeks & scenario analysis"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="option-pricer">Option Pricer</TabsTrigger>
          <TabsTrigger value="vol-surface">Vol Surface</TabsTrigger>
          <TabsTrigger value="greeks">Greeks Dashboard</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Analysis</TabsTrigger>
          <TabsTrigger value="structured-deals">Structured Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="option-pricer">
          <OptionPricerTab form={pricerForm} setForm={setPricerForm} result={pricerResult} onRun={runPricer} history={pricingRuns} />
        </TabsContent>
        <TabsContent value="vol-surface">
          <VolSurfaceTab data={filteredVolSurface} commodity={volCommodity} onCommodityChange={setVolCommodity} />
        </TabsContent>
        <TabsContent value="greeks">
          <GreeksDashboardTab data={greeks} />
        </TabsContent>
        <TabsContent value="scenarios">
          <ScenarioAnalysisTab scenarios={scenarios} priceShocks={priceShocks} volShocks={volShocks} />
        </TabsContent>
        <TabsContent value="structured-deals">
          <StructuredDealTab quotes={quotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

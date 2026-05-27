import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketDataKPIs } from '@/components/market-data/MarketDataKPIs';
import { MarketDataFilters } from '@/components/market-data/MarketDataFilters';
import { CurvesTable } from '@/components/market-data/CurvesTable';
import { CurveDetailPanel } from '@/components/market-data/CurveDetailPanel';
import { MarketExceptionsTable } from '@/components/market-data/MarketExceptionsTable';
import { LockAuditTable } from '@/components/market-data/LockAuditTable';
import { useMarketData } from '@/hooks/useMarketData';

const MarketData = () => {
  const {
    filters, setFilters, activeTab, setActiveTab,
    curves, exceptions, lockAudit,
    selectedCurve, selectedCurvePoints, setSelectedCurveId, kpis,
  } = useMarketData();

  return (
    <div className="space-y-6">
      <PageHeader title="Market Data & Curves" description="Govern fixings, curves, and FX rates feeding MTM valuations" />
      <MarketDataKPIs kpis={kpis} />
      <MarketDataFilters filters={filters} onFiltersChange={setFilters} />

      {selectedCurve ? (
        <CurveDetailPanel curve={selectedCurve} points={selectedCurvePoints} onBack={() => setSelectedCurveId(null)} />
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="curves">Curves</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="audit">Lock Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="curves" className="mt-4">
            <CurvesTable curves={curves} onSelectCurve={setSelectedCurveId} />
          </TabsContent>
          <TabsContent value="exceptions" className="mt-4">
            <MarketExceptionsTable exceptions={exceptions} />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <LockAuditTable entries={lockAudit} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MarketData;

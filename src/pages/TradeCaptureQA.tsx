import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradeQA } from '@/hooks/useTradeQA';
import { TradeQAKPIs } from '@/components/trade-qa/TradeQAKPIs';
import { TradeQAFilters } from '@/components/trade-qa/TradeQAFilters';
import { TradeQATable } from '@/components/trade-qa/TradeQATable';
import { ViolationDetailPanel } from '@/components/trade-qa/ViolationDetailPanel';
import { RulePacksCard } from '@/components/trade-qa/RulePacksCard';

const TradeCaptureQA = () => {
  const qa = useTradeQA();

  return (
    <div className="space-y-6">
      <PageHeader title="Trade Capture QA" description="Validate trades before they reach ERP and close processes" />
      <TradeQAKPIs stats={qa.stats} />
      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">QA Results</TabsTrigger>
          <TabsTrigger value="rules">Rule Packs</TabsTrigger>
        </TabsList>
        <TabsContent value="results" className="space-y-4">
          <TradeQAFilters
            tradeTypeFilter={qa.tradeTypeFilter} setTradeTypeFilter={qa.setTradeTypeFilter}
            resultFilter={qa.resultFilter} setResultFilter={qa.setResultFilter}
            severityFilter={qa.severityFilter} setSeverityFilter={qa.setSeverityFilter}
            searchQuery={qa.searchQuery} setSearchQuery={qa.setSearchQuery}
          />
          {qa.selectedResult && (
            <ViolationDetailPanel result={qa.selectedResult} onClose={() => qa.setSelectedResultId(null)} />
          )}
          <TradeQATable results={qa.filtered} onSelect={qa.setSelectedResultId} />
        </TabsContent>
        <TabsContent value="rules">
          <RulePacksCard rulePacks={qa.rulePacks} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradeCaptureQA;

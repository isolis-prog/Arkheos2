import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HedgeKPIs } from '@/components/hedge/HedgeKPIs';
import { HedgeFilters } from '@/components/hedge/HedgeFiltersBar';
import { RelationshipsTable } from '@/components/hedge/RelationshipsTable';
import { RelationshipDetailPanel } from '@/components/hedge/RelationshipDetailPanel';
import { TestResultsTable } from '@/components/hedge/TestResultsTable';
import { PacksGrid } from '@/components/hedge/PacksGrid';
import { AutoDesignationQueue } from '@/components/hedge/AutoDesignationQueue';
import { EffectivenessAutoTrigger } from '@/components/hedge/EffectivenessAutoTrigger';
import { CloseIntegrationPanel } from '@/components/hedge/CloseIntegrationPanel';
import { useHedgeAccounting } from '@/hooks/useHedgeAccounting';
import { useHedgeAutoDesignation } from '@/hooks/useHedgeAutoDesignation';
import { MetricCard } from '@/components/ui/metric-card';
import { FileEdit, Zap, AlertTriangle, Calendar } from 'lucide-react';

const HedgeAccounting = () => {
  const {
    filters, setFilters, activeTab, setActiveTab,
    relationships, allTests, allPacks,
    selectedRelationship, selectedTests, selectedPacks,
    setSelectedRelationshipId, kpis,
  } = useHedgeAccounting();

  const {
    drafts, autoTests, closeTasks,
    draftCount, pendingAutoTests, ineffectiveCount, openCloseTasks,
  } = useHedgeAutoDesignation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hedge Lifecycle & Accounting"
        description="Designate exposures, track effectiveness, and generate audit-ready hedge accounting packs (IFRS 9 / US GAAP)"
      />
      <HedgeKPIs kpis={kpis} />

      {/* Workflow KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Draft Designations" value={draftCount} icon={FileEdit} variant={draftCount > 0 ? 'warning' : 'default'} />
        <MetricCard title="Pending Auto-Tests" value={pendingAutoTests} icon={Zap} variant={pendingAutoTests > 0 ? 'warning' : 'default'} />
        <MetricCard title="Ineffective Results" value={ineffectiveCount} icon={AlertTriangle} variant={ineffectiveCount > 0 ? 'error' : 'success'} />
        <MetricCard title="Open Close Tasks" value={openCloseTasks} icon={Calendar} variant={openCloseTasks > 0 ? 'warning' : 'success'} />
      </div>

      <HedgeFilters filters={filters} onFiltersChange={setFilters} />

      {selectedRelationship ? (
        <RelationshipDetailPanel
          relationship={selectedRelationship}
          tests={selectedTests}
          packs={selectedPacks}
          onBack={() => setSelectedRelationshipId(null)}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="relationships">Hedge Relationships</TabsTrigger>
            <TabsTrigger value="tests">Effectiveness Tests</TabsTrigger>
            <TabsTrigger value="packs">Accounting Packs</TabsTrigger>
            <TabsTrigger value="auto-designation">Auto-Designation</TabsTrigger>
            <TabsTrigger value="auto-tests">Auto-Trigger</TabsTrigger>
            <TabsTrigger value="close">Close Integration</TabsTrigger>
          </TabsList>
          <TabsContent value="relationships" className="mt-4">
            <RelationshipsTable relationships={relationships} onSelect={setSelectedRelationshipId} />
          </TabsContent>
          <TabsContent value="tests" className="mt-4">
            <TestResultsTable tests={allTests} />
          </TabsContent>
          <TabsContent value="packs" className="mt-4">
            <PacksGrid packs={allPacks} />
          </TabsContent>
          <TabsContent value="auto-designation" className="mt-4">
            <AutoDesignationQueue drafts={drafts} />
          </TabsContent>
          <TabsContent value="auto-tests" className="mt-4">
            <EffectivenessAutoTrigger autoTests={autoTests} />
          </TabsContent>
          <TabsContent value="close" className="mt-4">
            <CloseIntegrationPanel closeTasks={closeTasks} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default HedgeAccounting;

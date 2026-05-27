import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { IntercompanyKPIs } from '@/components/intercompany/IntercompanyKPIs';
import { IntercompanyFilters } from '@/components/intercompany/IntercompanyFilters';
import { ICPairsTable } from '@/components/intercompany/ICPairsTable';
import { NettingCyclesPanel } from '@/components/intercompany/NettingCyclesPanel';
import { EliminationsTable } from '@/components/intercompany/EliminationsTable';
import { useIntercompany } from '@/hooks/useIntercompany';

const Intercompany = () => {
  const {
    pairs, cycles, eliminations,
    pairTypeFilter, setPairTypeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    kpis,
  } = useIntercompany();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intercompany, Netting & Eliminations"
        description="IC matching, netting proposals, and consolidation elimination journals"
      />

      <IntercompanyKPIs kpis={kpis} />

      <IntercompanyFilters
        pairTypeFilter={pairTypeFilter} setPairTypeFilter={setPairTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      />

      <Tabs defaultValue="pairs">
        <TabsList>
          <TabsTrigger value="pairs">IC Pairs ({pairs.length})</TabsTrigger>
          <TabsTrigger value="netting">Netting Cycles ({cycles.length})</TabsTrigger>
          <TabsTrigger value="eliminations">Eliminations ({eliminations.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pairs">
          <ICPairsTable pairs={pairs} />
        </TabsContent>
        <TabsContent value="netting">
          <NettingCyclesPanel cycles={cycles} />
        </TabsContent>
        <TabsContent value="eliminations">
          <EliminationsTable eliminations={eliminations} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Intercompany;

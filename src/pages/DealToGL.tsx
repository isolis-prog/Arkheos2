import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { DealToGLKPIs } from '@/components/deal-to-gl/DealToGLKPIs';
import { DealToGLFilters } from '@/components/deal-to-gl/DealToGLFilters';
import { ReconMatrixTable } from '@/components/deal-to-gl/ReconMatrixTable';
import { ExpectationsTable } from '@/components/deal-to-gl/ExpectationsTable';
import { TemplatesTable } from '@/components/deal-to-gl/TemplatesTable';
import { useDealToGL } from '@/hooks/useDealToGL';

const DealToGL = () => {
  const {
    templates, expectations, recons,
    entityFilter, setEntityFilter,
    accountFilter, setAccountFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    entities, accounts, kpis,
  } = useDealToGL();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deal-to-GL Control Tower"
        description="Completeness & cut-off — ensure every deal generates expected GL postings"
      />

      <DealToGLKPIs kpis={kpis} />

      <DealToGLFilters
        entityFilter={entityFilter} setEntityFilter={setEntityFilter}
        accountFilter={accountFilter} setAccountFilter={setAccountFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        entities={entities} accounts={accounts}
      />

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">Recon Matrix</TabsTrigger>
          <TabsTrigger value="details">Posting Details ({expectations.length})</TabsTrigger>
          <TabsTrigger value="templates">Expectation Templates ({templates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="matrix">
          <ReconMatrixTable recons={recons} />
        </TabsContent>
        <TabsContent value="details">
          <ExpectationsTable expectations={expectations} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTable templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealToGL;

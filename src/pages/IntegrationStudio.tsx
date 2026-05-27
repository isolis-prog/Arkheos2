import { useIntegrationStudio } from '@/hooks/useIntegrationStudio';
import { IntStudioKPIs } from '@/components/integration-studio/IntStudioKPIs';
import { IntStudioFilters } from '@/components/integration-studio/IntStudioFilters';
import { ConnectorCatalog } from '@/components/integration-studio/ConnectorCatalog';
import { InstancesTable } from '@/components/integration-studio/InstancesTable';
import { MappingsTable } from '@/components/integration-studio/MappingsTable';
import { JobsTable } from '@/components/integration-studio/JobsTable';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Plug, GitBranch, History } from 'lucide-react';

const IntegrationStudio = () => {
  const {
    catalog, instances, mappings, jobs,
    searchTerm, setSearchTerm, typeFilter, setTypeFilter,
    statusFilter, setStatusFilter, activeTab, setActiveTab, kpis,
  } = useIntegrationStudio();

  return (
    <div className="space-y-6">
      <PageHeader title="Integration Studio" description="Connector marketplace, field mappings, and integration job management" />
      <IntStudioKPIs kpis={kpis} />
      <IntStudioFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog" className="gap-1.5"><Store className="h-4 w-4" />Catalog ({catalog.length})</TabsTrigger>
          <TabsTrigger value="instances" className="gap-1.5"><Plug className="h-4 w-4" />Instances ({instances.length})</TabsTrigger>
          <TabsTrigger value="mappings" className="gap-1.5"><GitBranch className="h-4 w-4" />Mappings ({mappings.length})</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5"><History className="h-4 w-4" />Jobs ({jobs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog"><ConnectorCatalog connectors={catalog} /></TabsContent>
        <TabsContent value="instances"><InstancesTable instances={instances} /></TabsContent>
        <TabsContent value="mappings"><MappingsTable mappings={mappings} /></TabsContent>
        <TabsContent value="jobs"><JobsTable jobs={jobs} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationStudio;

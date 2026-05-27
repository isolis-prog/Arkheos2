import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Connectors tab (from Integration Studio)
import { useIntegrationStudio } from '@/hooks/useIntegrationStudio';
import { IntStudioKPIs } from '@/components/integration-studio/IntStudioKPIs';
import { IntStudioFilters } from '@/components/integration-studio/IntStudioFilters';
import { ConnectorCatalog } from '@/components/integration-studio/ConnectorCatalog';
import { InstancesTable } from '@/components/integration-studio/InstancesTable';
import { MappingsTable } from '@/components/integration-studio/MappingsTable';
import { JobsTable } from '@/components/integration-studio/JobsTable';

// Workflow Builder tab (from Studio)
import { MappingBuilder } from '@/components/studio/MappingBuilder';
import { WorkflowCanvas } from '@/components/studio/WorkflowCanvas';
import { SchedulerUI } from '@/components/studio/SchedulerUI';
import { TestHarness } from '@/components/studio/TestHarness';
import { VersionGovernance } from '@/components/studio/VersionGovernance';
import { useStudio } from '@/hooks/useStudio';

// API & Webhooks tab (from Developer Portal)
import { ApiKeysPanel } from '@/components/developer/ApiKeysPanel';
import { WebhooksPanel } from '@/components/developer/WebhooksPanel';
import { ApiExplorer } from '@/components/developer/ApiExplorer';
import { useDeveloperPlatform } from '@/hooks/useDeveloperPlatform';

import { Plug, Workflow, Code2 } from 'lucide-react';

const DeveloperHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'connectors';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer & Integrations"
        description="Connectors, workflow builder, API keys, and webhooks — all in one place"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connectors" className="gap-1.5">
            <Plug className="h-4 w-4" /> Connectors
          </TabsTrigger>
          <TabsTrigger value="workflow-builder" className="gap-1.5">
            <Workflow className="h-4 w-4" /> Workflow Builder
          </TabsTrigger>
          <TabsTrigger value="api-webhooks" className="gap-1.5">
            <Code2 className="h-4 w-4" /> API & Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connectors">
          <ConnectorsTab />
        </TabsContent>
        <TabsContent value="workflow-builder">
          <WorkflowBuilderTab />
        </TabsContent>
        <TabsContent value="api-webhooks">
          <ApiWebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ConnectorsTab = () => {
  const {
    catalog, instances, mappings, jobs,
    searchTerm, setSearchTerm, typeFilter, setTypeFilter,
    statusFilter, setStatusFilter, activeTab, setActiveTab, kpis,
  } = useIntegrationStudio();

  return (
    <div className="space-y-6 mt-4">
      <IntStudioKPIs kpis={kpis} />
      <IntStudioFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Catalog ({catalog.length})</TabsTrigger>
          <TabsTrigger value="instances">Instances ({instances.length})</TabsTrigger>
          <TabsTrigger value="mappings">Mappings ({mappings.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog"><ConnectorCatalog connectors={catalog} /></TabsContent>
        <TabsContent value="instances"><InstancesTable instances={instances} /></TabsContent>
        <TabsContent value="mappings"><MappingsTable mappings={mappings} /></TabsContent>
        <TabsContent value="jobs"><JobsTable jobs={jobs} /></TabsContent>
      </Tabs>
    </div>
  );
};

const WorkflowBuilderTab = () => {
  const { mappings, workflows, versions, runs, activeTab, setActiveTab } = useStudio();

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="test">Test Harness</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>
        <TabsContent value="mappings"><MappingBuilder mappings={mappings} /></TabsContent>
        <TabsContent value="workflows"><WorkflowCanvas workflows={workflows} /></TabsContent>
        <TabsContent value="scheduler"><SchedulerUI workflows={workflows} /></TabsContent>
        <TabsContent value="test"><TestHarness runs={runs} /></TabsContent>
        <TabsContent value="governance"><VersionGovernance versions={versions} /></TabsContent>
      </Tabs>
    </div>
  );
};

const ApiWebhooksTab = () => {
  const dev = useDeveloperPlatform();

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={dev.activeTab} onValueChange={dev.setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="explorer">API Explorer</TabsTrigger>
        </TabsList>
        <TabsContent value="keys">
          <ApiKeysPanel apiKeys={dev.apiKeys} auditLogs={dev.auditLogs} auditStats={dev.auditStats} />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksPanel webhooks={dev.webhooks} deliveries={dev.deliveries} deliveryStats={dev.deliveryStats} />
        </TabsContent>
        <TabsContent value="explorer">
          <ApiExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperHub;

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { MappingBuilder } from '@/components/studio/MappingBuilder';
import { WorkflowCanvas } from '@/components/studio/WorkflowCanvas';
import { SchedulerUI } from '@/components/studio/SchedulerUI';
import { TestHarness } from '@/components/studio/TestHarness';
import { VersionGovernance } from '@/components/studio/VersionGovernance';
import { useStudio } from '@/hooks/useStudio';
import { Layers, Workflow, Calendar, FlaskConical, GitBranch } from 'lucide-react';

const Studio = () => {
  const { mappings, workflows, versions, runs, activeTab, setActiveTab } = useStudio();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studio"
        description="No-code configuration for mappings, workflows, schedules, and governance"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mappings" className="gap-1.5"><Layers className="h-4 w-4" /> Mappings</TabsTrigger>
          <TabsTrigger value="workflows" className="gap-1.5"><Workflow className="h-4 w-4" /> Workflows</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-1.5"><Calendar className="h-4 w-4" /> Scheduler</TabsTrigger>
          <TabsTrigger value="test" className="gap-1.5"><FlaskConical className="h-4 w-4" /> Test Harness</TabsTrigger>
          <TabsTrigger value="governance" className="gap-1.5"><GitBranch className="h-4 w-4" /> Governance</TabsTrigger>
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

export default Studio;

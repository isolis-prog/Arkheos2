import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowTemplates } from '@/components/trade-to-cash/WorkflowTemplates';
import { WorkflowBuilder } from '@/components/trade-to-cash/WorkflowBuilder';
import { RunDashboard } from '@/components/trade-to-cash/RunDashboard';
import { PostingQueue } from '@/components/trade-to-cash/PostingQueue';
import { useTradeToCash } from '@/hooks/useTradeToCash';
import { useState } from 'react';

const TradeToCash = () => {
  const t2c = useTradeToCash();
  const [tab, setTab] = useState('runs');

  // Show pipeline for the first active workflow
  const activeWorkflow = t2c.workflows.find(w => w.status === 'active');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade-to-Cash"
        description="Automate deal → fees → invoices → vouchers → journals → AP/AR → GL with full traceability"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="runs">Run Dashboard</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Templates</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="queue">Posting Queue ({t2c.pendingApprovalDocs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
          <RunDashboard
            runs={t2c.filteredRuns}
            stats={t2c.stats}
            statusFilter={t2c.statusFilter}
            setStatusFilter={t2c.setStatusFilter}
            searchQuery={t2c.searchQuery}
            setSearchQuery={t2c.setSearchQuery}
            onSelectRun={t2c.setSelectedRunId}
          />
          {t2c.selectedRunId && t2c.selectedRunDocs.length > 0 && (
            <div className="mt-6">
              <PostingQueue documents={t2c.selectedRunDocs} title={`Documents — Run ${t2c.selectedRunId}`} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowTemplates
            workflows={t2c.filteredWorkflows}
            statusFilter={t2c.statusFilter}
            setStatusFilter={t2c.setStatusFilter}
            searchQuery={t2c.searchQuery}
            setSearchQuery={t2c.setSearchQuery}
          />
        </TabsContent>

        <TabsContent value="pipeline">
          {activeWorkflow ? (
            <WorkflowBuilder steps={activeWorkflow.steps} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">No active workflow selected</div>
          )}
        </TabsContent>

        <TabsContent value="queue">
          <PostingQueue documents={t2c.pendingApprovalDocs} title="Pending Approval" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradeToCash;

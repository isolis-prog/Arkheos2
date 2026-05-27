import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMDMGovernance } from '@/hooks/useMDMGovernance';
import { MDMKPIs } from '@/components/mdm-governance/MDMKPIs';
import { MDMFilters } from '@/components/mdm-governance/MDMFilters';
import { CoverageHeatmaps } from '@/components/mdm-governance/CoverageHeatmaps';
import { IssuesTable } from '@/components/mdm-governance/IssuesTable';
import { ChangeRequestsQueue } from '@/components/mdm-governance/ChangeRequestsQueue';

const MDMGovernance = () => {
  const mdm = useMDMGovernance();

  return (
    <div className="space-y-6">
      <PageHeader title="Master Data Governance" description="Golden record coverage, mapping change requests, and close-readiness gates" />
      <MDMKPIs stats={mdm.stats} />
      <Tabs defaultValue="coverage">
        <TabsList>
          <TabsTrigger value="coverage">Coverage Heatmaps</TabsTrigger>
          <TabsTrigger value="issues">Coverage Issues ({mdm.filteredIssues.length})</TabsTrigger>
          <TabsTrigger value="requests">Change Requests ({mdm.filteredRequests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="coverage" className="space-y-4">
          <CoverageHeatmaps heatmaps={mdm.heatmaps} />
        </TabsContent>
        <TabsContent value="issues" className="space-y-4">
          <MDMFilters
            categoryFilter={mdm.categoryFilter} setCategoryFilter={mdm.setCategoryFilter}
            severityFilter={mdm.severityFilter} setSeverityFilter={mdm.setSeverityFilter}
            statusFilter={mdm.statusFilter} setStatusFilter={mdm.setStatusFilter}
            searchQuery={mdm.searchQuery} setSearchQuery={mdm.setSearchQuery}
          />
          <IssuesTable issues={mdm.filteredIssues} />
        </TabsContent>
        <TabsContent value="requests" className="space-y-4">
          <ChangeRequestsQueue requests={mdm.filteredRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MDMGovernance;

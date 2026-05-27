import { useDataHealth } from '@/hooks/useDataHealth';
import { DataHealthKPIs } from '@/components/data-health/DataHealthKPIs';
import { DataHealthFilters } from '@/components/data-health/DataHealthFilters';
import { SourceHealthCards } from '@/components/data-health/SourceHealthCards';
import { IssuesTable } from '@/components/data-health/IssuesTable';
import { RulesTable } from '@/components/data-health/RulesTable';
import { CheckRunsTable } from '@/components/data-health/CheckRunsTable';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, BookOpen, History } from 'lucide-react';

const DataHealth = () => {
  const {
    rules, runs, issues, scores, sourceHealth,
    searchTerm, setSearchTerm, sourceFilter, setSourceFilter,
    severityFilter, setSeverityFilter, activeTab, setActiveTab, kpis,
  } = useDataHealth();

  return (
    <div className="space-y-6">
      <PageHeader title="Data Health Observatory" description="Monitor data quality across sources, detect issues, and track remediation" />
      <DataHealthKPIs kpis={kpis} />
      <DataHealthFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
        severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-4 w-4" />Health Overview</TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5"><AlertTriangle className="h-4 w-4" />Issues ({issues.length})</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><BookOpen className="h-4 w-4" />Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="runs" className="gap-1.5"><History className="h-4 w-4" />Check Runs ({runs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><SourceHealthCards sourceHealth={sourceHealth} scores={scores} /></TabsContent>
        <TabsContent value="issues"><IssuesTable issues={issues} /></TabsContent>
        <TabsContent value="rules"><RulesTable rules={rules} /></TabsContent>
        <TabsContent value="runs"><CheckRunsTable runs={runs} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default DataHealth;

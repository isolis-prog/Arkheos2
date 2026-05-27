import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditKPIs } from '@/components/internal-audit/AuditKPIs';
import { AuditPlanTab } from '@/components/internal-audit/AuditPlanTab';
import { ControlTestsTab } from '@/components/internal-audit/ControlTestsTab';
import { FindingsTab } from '@/components/internal-audit/FindingsTab';
import { IssueTrackerTab } from '@/components/internal-audit/IssueTrackerTab';
import { BoardReportTab } from '@/components/internal-audit/BoardReportTab';
import { useInternalAudit } from '@/hooks/useInternalAudit';
import { ClipboardCheck } from 'lucide-react';

const InternalAudit = () => {
  const { activeTab, setActiveTab, plans, tests, findings, trend, kpis } = useInternalAudit();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ClipboardCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Internal Audit</h1>
          <p className="text-sm text-muted-foreground">
            Audit planning, control testing, findings management & board reporting
          </p>
        </div>
      </div>

      <AuditKPIs {...kpis} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="plan">Audit Plan</TabsTrigger>
          <TabsTrigger value="tests">Control Tests</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="issues">Issue Tracker</TabsTrigger>
          <TabsTrigger value="report">Board Report</TabsTrigger>
        </TabsList>
        <TabsContent value="plan"><AuditPlanTab plans={plans} /></TabsContent>
        <TabsContent value="tests"><ControlTestsTab tests={tests} /></TabsContent>
        <TabsContent value="findings"><FindingsTab findings={findings} /></TabsContent>
        <TabsContent value="issues"><IssueTrackerTab findings={findings} trend={trend} /></TabsContent>
        <TabsContent value="report">
          <BoardReportTab {...kpis} findings={findings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalAudit;

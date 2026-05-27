import { useState } from 'react';

export type InternalAuditTab = 'plan' | 'tests' | 'findings' | 'issues' | 'report';

const demoPlans = [
  { id: '1', subject: 'Trading Desk Controls — Crude', quarter: 'Q1 2026', auditor: 'Sarah Chen', scope: 'Review all trade approvals, limit breaches, and MO sign-offs for Crude desk', status: 'COMPLETED' },
  { id: '2', subject: 'Regulatory Filing Compliance', quarter: 'Q2 2026', auditor: 'James Wilson', scope: 'Verify all CFTC/FERC filings submitted before deadline with proper validation', status: 'IN_PROGRESS' },
  { id: '3', subject: 'Credit Risk Framework', quarter: 'Q2 2026', auditor: 'Sarah Chen', scope: 'Review credit line approvals, exposure monitoring, and margin call processes', status: 'PLANNED' },
  { id: '4', subject: 'Cashflow Reconciliation', quarter: 'Q3 2026', auditor: 'James Wilson', scope: 'Verify bank statement matching, settlement accuracy, and exception handling', status: 'PLANNED' },
  { id: '5', subject: 'IT General Controls', quarter: 'Q4 2026', auditor: 'Maria Lopez', scope: 'Access management, change management, data backup procedures', status: 'PLANNED' },
];

const demoTests = [
  { id: '1', name: 'MO Trade Approval Completeness', description: 'All trades above threshold approved by Middle Office', frequency: 'MONTHLY', automated: true, lastResult: 'PASS', lastRun: '2026-04-01', exceptions: 0 },
  { id: '2', name: 'Separation of Duties — Trade Approval', description: 'No user approved their own trade', frequency: 'MONTHLY', automated: true, lastResult: 'PASS', lastRun: '2026-04-01', exceptions: 0 },
  { id: '3', name: 'Limit Breach Response Documentation', description: 'All limit breaches have documented response within 24h', frequency: 'MONTHLY', automated: true, lastResult: 'FAIL', lastRun: '2026-04-01', exceptions: 3 },
  { id: '4', name: 'Regulatory Filing Timeliness', description: 'All regulatory filings submitted before due date', frequency: 'QUARTERLY', automated: true, lastResult: 'PASS', lastRun: '2026-03-31', exceptions: 0 },
  { id: '5', name: 'Exception Resolution SLA', description: 'Average exception resolution time within SLA (48h)', frequency: 'MONTHLY', automated: true, lastResult: 'PARTIAL', lastRun: '2026-04-01', exceptions: 7 },
  { id: '6', name: 'Credit Line Approval Authority', description: 'Credit lines approved only by CREDIT_ADMIN users', frequency: 'QUARTERLY', automated: true, lastResult: 'PASS', lastRun: '2026-03-31', exceptions: 0 },
];

const demoFindings = [
  { id: '1', title: 'Undocumented limit breach responses on Gas desk', severity: 'HIGH', rootCause: 'Manual process gap — responders not trained on documentation requirement', module: 'Position & Risk', desk: 'Gas', owner: 'Mike Peters', dueDate: '2026-05-15', status: 'OPEN', daysOpen: 10 },
  { id: '2', title: 'Exception SLA breaches above 15% threshold', severity: 'MEDIUM', rootCause: 'Understaffing during month-end close period', module: 'Reconciliations', desk: 'Operations', owner: 'Lisa Wang', dueDate: '2026-04-30', status: 'IN_PROGRESS', daysOpen: 22 },
  { id: '3', title: 'Missing MO sign-off for 2 after-hours trades', severity: 'HIGH', rootCause: 'After-hours trading workflow bypasses standard approval queue', module: 'Middle Office', desk: 'Crude', owner: 'Sarah Chen', dueDate: '2026-04-20', status: 'REMEDIATED', daysOpen: 35 },
  { id: '4', title: 'Stale market data used in 3 IPV calculations', severity: 'CRITICAL', rootCause: 'Data feed timeout not caught by monitoring', module: 'Market Data Controls', desk: 'Risk', owner: 'James Wilson', dueDate: '2026-04-10', status: 'OPEN', daysOpen: 5 },
];

const demoTrend = [
  { month: 'Nov', opened: 4, closed: 3 },
  { month: 'Dec', opened: 2, closed: 5 },
  { month: 'Jan', opened: 6, closed: 4 },
  { month: 'Feb', opened: 3, closed: 3 },
  { month: 'Mar', opened: 5, closed: 6 },
  { month: 'Apr', opened: 4, closed: 2 },
];

export function useInternalAudit() {
  const [activeTab, setActiveTab] = useState<InternalAuditTab>('plan');

  const openFindings = demoFindings.filter(f => f.status === 'OPEN' || f.status === 'IN_PROGRESS');
  const overdueFindings = demoFindings.filter(f => (f.status === 'OPEN' || f.status === 'IN_PROGRESS') && new Date(f.dueDate) < new Date());
  const completedAudits = demoPlans.filter(p => p.status === 'COMPLETED').length;
  const passRate = Math.round((demoTests.filter(t => t.lastResult === 'PASS').length / demoTests.length) * 100);

  return {
    activeTab, setActiveTab,
    plans: demoPlans,
    tests: demoTests,
    findings: demoFindings,
    trend: demoTrend,
    kpis: {
      auditsCompleted: completedAudits,
      totalPlanned: demoPlans.length,
      controlPassRate: passRate,
      openFindings: openFindings.length,
      overdueFindings: overdueFindings.length,
    },
  };
}

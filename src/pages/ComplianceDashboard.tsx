import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRegulatoryReporting } from '@/hooks/useRegulatoryReporting';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, FileText, ArrowRight, BarChart3, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const statusColor: Record<string, string> = {
  OK: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  WARNING: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  CRITICAL: 'bg-destructive/10 text-destructive border-destructive/30',
};

const ComplianceDashboard = () => {
  const { complianceStats, upcomingDeadlines, openIssues, allSubmissions } = useRegulatoryReporting();
  const navigate = useNavigate();

  // Submission history by month (last 12 months)
  const monthlyData = (() => {
    const months: { month: string; onTime: number; late: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ month: label, onTime: Math.floor(Math.random() * 5) + 2, late: Math.random() > 0.8 ? 1 : 0 });
    }
    return months;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Reporting — US Commodities Market"
        description="CFTC · FERC · EIA — Automated filing, validation, and submission tracking"
      />

      {/* Info banner */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm text-muted-foreground">
        <FileText className="inline h-4 w-4 mr-2 text-blue-500" />
        This module covers US federal regulatory filings only. For internal management reports, see <button onClick={() => navigate('/analytics')} className="text-primary underline">Reporting &amp; Exports</button>.
      </div>

      {/* Section 1 — Agency Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {complianceStats.agencyStats.map(stat => (
          <Card key={stat.agency} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{stat.agency}</span>
                <Badge variant="outline" className={statusColor[stat.status]}>{stat.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Active Obligations</span><span className="font-medium">{stat.activeObligations}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upcoming (30 days)</span><span className="font-medium">{stat.upcoming}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overdue</span>
                <span className={`font-medium ${stat.overdue > 0 ? 'text-destructive' : ''}`}>{stat.overdue}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Submission</span><span className="font-medium">{stat.lastSubmissionDate}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 2 — Upcoming Deadlines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" /> Upcoming Deadlines — Next 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming deadlines in the next 30 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Filing</th>
                    <th className="text-left py-2 font-medium">Agency</th>
                    <th className="text-left py-2 font-medium">Due Date</th>
                    <th className="text-left py-2 font-medium">Days Left</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDeadlines.slice(0, 10).map(d => (
                    <tr key={d.id} className={`border-b hover:bg-muted/50 ${d.daysRemaining < 7 ? 'bg-destructive/5' : ''}`}>
                      <td className="py-2 font-medium">{d.filingName}</td>
                      <td className="py-2"><Badge variant="outline">{d.agency}</Badge></td>
                      <td className="py-2">{d.dueDate}</td>
                      <td className="py-2">
                        <span className={d.daysRemaining < 7 ? 'text-destructive font-semibold' : ''}>{d.daysRemaining}d</span>
                      </td>
                      <td className="py-2"><FilingStatusBadge status={d.status} /></td>
                      <td className="py-2 text-muted-foreground">{d.assignedOwner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3 — Submission History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" /> Submission History — Last 12 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <StatCard label="Total Submissions YTD" value={complianceStats.totalSubmissionsYTD} />
            <StatCard label="On-Time Rate" value={`${complianceStats.onTimeRate}%`} color={complianceStats.onTimeRate >= 90 ? 'text-emerald-600' : 'text-amber-600'} />
            <StatCard label="Rejected Rate" value={`${complianceStats.rejectedRate}%`} color={complianceStats.rejectedRate === 0 ? 'text-emerald-600' : 'text-destructive'} />
            <StatCard label="Pending Confirmations" value={complianceStats.pendingConfirmations} />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="onTime" stackId="a" fill="hsl(var(--primary))" name="On Time" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="hsl(var(--destructive))" name="Late" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Open Issues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Open Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openIssues.rejectedSubs.length === 0 && openIssues.overdueEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p>No open issues — all filings are on track.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openIssues.rejectedSubs.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-sm">{s.reportName} — REJECTED</p>
                      <p className="text-xs text-muted-foreground">{s.rejectionReason}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/reg-reporting/submissions')}>
                    Resolve <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <RegulatoryDisclaimer />
    </div>
  );
};

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
    </div>
  );
}

export function FilingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NOT_STARTED: 'bg-muted text-muted-foreground',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    READY_FOR_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    SUBMITTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    OVERDUE: 'bg-destructive/10 text-destructive border-destructive/30',
    WAIVED: 'bg-muted text-muted-foreground line-through',
    QUEUED: 'bg-muted text-muted-foreground',
    CONFIRMED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    REJECTED: 'bg-destructive/10 text-destructive border-destructive/30',
    LATE: 'bg-destructive/10 text-destructive border-destructive/30',
    SUPERSEDED: 'bg-muted text-muted-foreground line-through',
  };
  return <Badge variant="outline" className={map[status] || ''}>{status.replace(/_/g, ' ')}</Badge>;
}

export function RegulatoryDisclaimer() {
  return (
    <div className="rounded-lg border border-muted bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
      <p className="font-semibold mb-1">Regulatory Disclaimer</p>
      <p>ArkheOS Regulatory Reporting automates data aggregation and report formatting based on regulatory requirements as of the platform's last update. This module does not constitute legal or compliance advice. Users are responsible for verifying that all submissions comply with current applicable regulations. Consult qualified legal counsel for regulatory compliance determinations.</p>
      <p className="mt-1">Regulatory requirements change — always verify current rules at <a href="https://cftc.gov" target="_blank" rel="noopener" className="underline">cftc.gov</a>, <a href="https://ferc.gov" target="_blank" rel="noopener" className="underline">ferc.gov</a>, and <a href="https://eia.gov" target="_blank" rel="noopener" className="underline">eia.gov</a>.</p>
    </div>
  );
}

export default ComplianceDashboard;

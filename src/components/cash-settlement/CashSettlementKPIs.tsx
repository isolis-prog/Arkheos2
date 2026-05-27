import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle, AlertTriangle, Banknote, FileQuestion, GitPullRequest, CreditCard } from 'lucide-react';

interface Props {
  stats: { totalTxns: number; matchedPct: number; unmatchedCount: number; unmatchedAmount: number; exceptionCount: number; shortPays: number; unappliedCash: number; proposedCount: number; };
}

export const CashSettlementKPIs = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <MetricCard title="Match Rate" value={`${stats.matchedPct}%`} subtitle={`${stats.totalTxns} bank txns`} icon={CheckCircle} />
    <MetricCard title="Unmatched" value={stats.unmatchedCount} subtitle={`$${stats.unmatchedAmount.toLocaleString()}`} icon={FileQuestion} />
    <MetricCard title="Exceptions" value={stats.exceptionCount} subtitle="Need resolution" icon={AlertTriangle} />
    <MetricCard title="Short Pays" value={stats.shortPays} subtitle="Under-remittance" icon={CreditCard} />
    <MetricCard title="Unapplied Cash" value={stats.unappliedCash} subtitle="No invoice match" icon={Banknote} />
    <MetricCard title="Proposed" value={stats.proposedCount} subtitle="Awaiting review" icon={GitPullRequest} />
  </div>
);

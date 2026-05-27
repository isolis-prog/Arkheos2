import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle, AlertTriangle, Clock, FileCheck, Search, XCircle } from 'lucide-react';

interface Props {
  total: number;
  matchRate: number;
  pendingReview: number;
  unmatched: number;
  readyToInvoice: number;
  disputed: number;
}

export const ConfirmationsKPIs = ({ total, matchRate, pendingReview, unmatched, readyToInvoice, disputed }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
    <MetricCard title="Total Confirmations" value={total} icon={FileCheck} />
    <MetricCard title="Match Rate" value={`${matchRate}%`} icon={CheckCircle} variant={matchRate >= 90 ? 'success' : matchRate >= 70 ? 'warning' : 'error'} />
    <MetricCard title="Pending Review" value={pendingReview} icon={Search} variant={pendingReview > 0 ? 'warning' : 'default'} />
    <MetricCard title="Unmatched" value={unmatched} icon={XCircle} variant={unmatched > 0 ? 'error' : 'default'} />
    <MetricCard title="Disputed" value={disputed} icon={AlertTriangle} variant={disputed > 0 ? 'error' : 'default'} />
    <MetricCard title="Ready to Invoice" value={readyToInvoice} icon={Clock} variant="success" />
  </div>
);

import { MetricCard } from '@/components/ui/metric-card';
import { FileSearch, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

interface Props {
  kpis: {
    openDiffs: number;
    pctProcessed: number;
    openExceptions: number;
    avgConfidence: number;
    totalDocs: number;
    extractedDocs: number;
  };
}

export const DocIntelKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="Docs Processed"
      value={`${kpis.pctProcessed}%`}
      subtitle={`${kpis.extractedDocs} of ${kpis.totalDocs} documents`}
      icon={FileSearch}
      variant="info"
    />
    <MetricCard
      title="Open Mismatches"
      value={kpis.openDiffs}
      subtitle="Document vs deal diffs"
      icon={AlertTriangle}
      variant={kpis.openDiffs > 3 ? 'error' : 'warning'}
    />
    <MetricCard
      title="Open Exceptions"
      value={kpis.openExceptions}
      subtitle="Requiring investigation"
      icon={AlertTriangle}
      variant={kpis.openExceptions > 3 ? 'error' : 'warning'}
    />
    <MetricCard
      title="Extraction Confidence"
      value={`${kpis.avgConfidence}%`}
      subtitle="Average AI confidence"
      icon={Brain}
      variant={kpis.avgConfidence >= 90 ? 'success' : 'warning'}
    />
  </div>
);

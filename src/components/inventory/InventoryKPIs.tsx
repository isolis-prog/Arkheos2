import { MetricCard } from '@/components/ui/metric-card';
import { Package, DollarSign, AlertTriangle, Clock, FileWarning } from 'lucide-react';

interface Props {
  kpis: {
    totalValue: number;
    totalGlVariance: number;
    unreconciledCount: number;
    pctWithoutDoc: number;
    agingLots: number;
    activeLotCount: number;
  };
}

export const InventoryKPIs = ({ kpis }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <MetricCard
      title="Total Inventory Value"
      value={`$${(kpis.totalValue / 1e6).toFixed(1)}M`}
      subtitle={`${kpis.activeLotCount} active lots`}
      icon={DollarSign}
      variant="info"
    />
    <MetricCard
      title="GL Variance"
      value={`$${kpis.totalGlVariance.toLocaleString()}`}
      subtitle="Subledger ↔ GL delta"
      icon={AlertTriangle}
      variant={kpis.totalGlVariance > 50000 ? 'error' : kpis.totalGlVariance > 0 ? 'warning' : 'success'}
    />
    <MetricCard
      title="Unreconciled"
      value={kpis.unreconciledCount}
      subtitle="Periods pending recon"
      icon={FileWarning}
      variant={kpis.unreconciledCount > 0 ? 'warning' : 'success'}
    />
    <MetricCard
      title="Aging Lots"
      value={kpis.agingLots}
      subtitle="> 60 days since receipt"
      icon={Clock}
      variant={kpis.agingLots > 2 ? 'warning' : 'default'}
    />
    <MetricCard
      title="Unsupported Movements"
      value={`${kpis.pctWithoutDoc.toFixed(0)}%`}
      subtitle="Without doc reference"
      icon={Package}
      variant={kpis.pctWithoutDoc > 10 ? 'error' : 'default'}
    />
  </div>
);

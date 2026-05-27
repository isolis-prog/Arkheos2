import { PageHeader } from '@/components/ui/page-header';
import { ISOKPIs } from '@/components/iso-settlements/ISOKPIs';
import { ISOFilters } from '@/components/iso-settlements/ISOFilters';
import { StatementsTable } from '@/components/iso-settlements/StatementsTable';
import { ReconDrilldown } from '@/components/iso-settlements/ReconDrilldown';
import { ISOBreakdownCard } from '@/components/iso-settlements/ISOBreakdownCard';
import { useISOSettlements } from '@/hooks/useISOSettlements';
import { Zap, MapPin, AlertTriangle } from 'lucide-react';

const ISOSettlementsPage = () => {
  const iso = useISOSettlements();

  if (iso.selectedStatement) {
    return (
      <div className="space-y-6">
        <PageHeader title="ISO Settlements" description="Node/interval drilldown" />
        <ReconDrilldown
          statement={iso.selectedStatement}
          results={iso.selectedReconResults}
          chargeTypeFilter={iso.chargeTypeFilter}
          setChargeTypeFilter={iso.setChargeTypeFilter}
          onBack={() => iso.setSelectedStatementId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ISO Settlements" description="DA/RT, congestion, uplift, losses & ancillary reconciliation vs ETRM & GL" />
      <ISOKPIs kpis={iso.kpis} />
      <ISOFilters
        isoFilter={iso.isoFilter} setIsoFilter={iso.setIsoFilter}
        statusFilter={iso.statusFilter} setStatusFilter={iso.setStatusFilter}
        searchQuery={iso.searchQuery} setSearchQuery={iso.setSearchQuery}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <StatementsTable statements={iso.filteredStatements} onSelect={iso.setSelectedStatementId} />
        </div>
        <div className="space-y-4">
          <ISOBreakdownCard title="Breaks by Charge Type" icon={<Zap className="h-4 w-4 text-destructive" />} items={iso.kpis.topChargeTypes} />
          <ISOBreakdownCard title="Top Nodes" icon={<MapPin className="h-4 w-4 text-primary" />} items={iso.kpis.topNodes} />
          <ISOBreakdownCard title="Root Causes" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={iso.kpis.rootCauses} format="count" />
        </div>
      </div>
    </div>
  );
};

export default ISOSettlementsPage;

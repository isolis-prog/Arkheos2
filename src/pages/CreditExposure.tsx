import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditKPIs } from '@/components/credit/CreditKPIs';
import { CreditFilters } from '@/components/credit/CreditFilters';
import { ControlTowerTable } from '@/components/credit/ControlTowerTable';
import { ExposureChart } from '@/components/credit/ExposureChart';
import { ARAgingPanel } from '@/components/credit/ARAgingPanel';
import { CreditAlertsPanel } from '@/components/credit/CreditAlertsPanel';
import { DisputesTable } from '@/components/credit/DisputesTable';
import { CreditMemosTable } from '@/components/credit/CreditMemosTable';
import { ExposureDetailPanel } from '@/components/credit/ExposureDetailPanel';
import { useCreditExposure, type ExposureSnapshot } from '@/hooks/useCreditExposure';

const CreditExposure = () => {
  const {
    snapshots, allSnapshots, alerts, limits, disputes, creditMemos,
    searchQuery, setSearchQuery, trafficFilter, setTrafficFilter, kpis,
  } = useCreditExposure();
  const [selected, setSelected] = useState<ExposureSnapshot | null>(null);
  const selectedLimit = selected ? limits.find(l => l.counterparty === selected.counterparty) || null : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Control Tower"
        description="Counterparty exposure vs AR/AP reality — traffic-light monitoring, disputes & recommended actions"
      />

      <CreditKPIs kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExposureChart snapshots={allSnapshots} />
        </div>
        <ARAgingPanel snapshots={allSnapshots} />
      </div>

      <CreditFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        trafficFilter={trafficFilter}
        setTrafficFilter={setTrafficFilter}
      />

      <Tabs defaultValue="tower">
        <TabsList>
          <TabsTrigger value="tower">Control Tower</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({disputes.filter(d => d.status !== 'resolved').length})</TabsTrigger>
          <TabsTrigger value="memos">Credit Memos ({creditMemos.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="tower">
          <ControlTowerTable snapshots={snapshots} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="disputes">
          <DisputesTable disputes={disputes} />
        </TabsContent>
        <TabsContent value="memos">
          <CreditMemosTable memos={creditMemos} />
        </TabsContent>
        <TabsContent value="alerts">
          <CreditAlertsPanel alerts={alerts} />
        </TabsContent>
      </Tabs>

      <ExposureDetailPanel snapshot={selected} limit={selectedLimit} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default CreditExposure;

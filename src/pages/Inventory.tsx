import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/hooks/useInventory';
import { InventoryKPIs } from '@/components/inventory/InventoryKPIs';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { SiteHeatmap } from '@/components/inventory/SiteHeatmap';
import { LotsTable } from '@/components/inventory/LotsTable';
import { LotDetailPanel } from '@/components/inventory/LotDetailPanel';
import { ValuationBridge } from '@/components/inventory/ValuationBridge';
import { useState } from 'react';

const Inventory = () => {
  const inv = useInventory();
  const [tab, setTab] = useState('overview');

  const selectedLot = inv.lots.find(l => l.id === inv.selectedLotId) || null;

  const handleSiteClick = (site: string) => {
    inv.setSiteFilter(site);
    setTab('lots');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock Valuation"
        description="Physical vs book inventory, lot-level positions, and subledger ↔ GL reconciliation"
      />

      <InventoryKPIs kpis={inv.kpis} />

      <InventoryFilters
        sites={inv.sites}
        commodities={inv.commodities}
        siteFilter={inv.siteFilter}
        setSiteFilter={inv.setSiteFilter}
        commodityFilter={inv.commodityFilter}
        setCommodityFilter={inv.setCommodityFilter}
        statusFilter={inv.statusFilter}
        setStatusFilter={inv.setStatusFilter}
        periodFilter={inv.periodFilter}
        setPeriodFilter={inv.setPeriodFilter}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Site Overview ({inv.siteHeatmap.length})</TabsTrigger>
          <TabsTrigger value="lots">Lots ({inv.lots.length})</TabsTrigger>
          <TabsTrigger value="valuation">Valuation Bridge ({inv.snapshots.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SiteHeatmap data={inv.siteHeatmap} onSiteClick={handleSiteClick} />
        </TabsContent>

        <TabsContent value="lots" className="space-y-4">
          <LotsTable lots={inv.lots} onSelect={inv.setSelectedLotId} />
          {selectedLot && (
            <LotDetailPanel
              lot={selectedLot}
              movements={inv.movements}
              onClose={() => inv.setSelectedLotId(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="valuation">
          <ValuationBridge snapshots={inv.snapshots} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;

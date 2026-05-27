import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShippingChartering } from '@/hooks/useShippingChartering';
import { VoyageManagerTab } from '@/components/shipping/VoyageManagerTab';
import { FreightPnLTab } from '@/components/shipping/FreightPnLTab';
import { DemurrageTab } from '@/components/shipping/DemurrageTab';
import { FFAPositionsTab } from '@/components/shipping/FFAPositionsTab';
import { BunkerManagementTab } from '@/components/shipping/BunkerManagementTab';

const ShippingChartering = () => {
  const sc = useShippingChartering();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping & Chartering"
        description="Vessel chartering, voyage economics, freight derivatives & bunker management"
      />

      <Tabs value={sc.activeTab} onValueChange={sc.setActiveTab}>
        <TabsList>
          <TabsTrigger value="voyages">Voyages ({sc.voyages.length})</TabsTrigger>
          <TabsTrigger value="freight-pnl">Freight P&L</TabsTrigger>
          <TabsTrigger value="demurrage">Demurrage ({sc.demurrageClaims.length})</TabsTrigger>
          <TabsTrigger value="ffa">FFA Positions ({sc.ffaPositions.length})</TabsTrigger>
          <TabsTrigger value="bunker">Bunker ({sc.bunkerLiftings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="voyages">
          <VoyageManagerTab
            voyages={sc.voyages}
            statusFilter={sc.statusFilter}
            setStatusFilter={sc.setStatusFilter}
            searchQuery={sc.searchQuery}
            setSearchQuery={sc.setSearchQuery}
          />
        </TabsContent>

        <TabsContent value="freight-pnl">
          <FreightPnLTab />
        </TabsContent>

        <TabsContent value="demurrage">
          <DemurrageTab claims={sc.demurrageClaims} />
        </TabsContent>

        <TabsContent value="ffa">
          <FFAPositionsTab positions={sc.ffaPositions} />
        </TabsContent>

        <TabsContent value="bunker">
          <BunkerManagementTab liftings={sc.bunkerLiftings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShippingChartering;

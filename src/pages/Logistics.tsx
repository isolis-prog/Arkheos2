import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MovementsTable } from '@/components/logistics/MovementsTable';
import { NominationsTable } from '@/components/logistics/NominationsTable';
import { InventoryGrid } from '@/components/logistics/InventoryGrid';
import { LogisticsRecon } from '@/components/logistics/LogisticsRecon';
import { useLogistics } from '@/hooks/useLogistics';
import { useState } from 'react';

const Logistics = () => {
  const logistics = useLogistics();
  const [tab, setTab] = useState('movements');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logistics"
        description="Movements, nominations, inventory positions, and logistics reconciliation"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="movements">Movements ({logistics.movements.length})</TabsTrigger>
          <TabsTrigger value="nominations">Nominations ({logistics.nominations.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({logistics.inventory.length})</TabsTrigger>
          <TabsTrigger value="recon">Reconciliation ({logistics.reconResults.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <MovementsTable
            movements={logistics.movements}
            filter={logistics.movementFilter}
            setFilter={logistics.setMovementFilter}
            searchQuery={logistics.searchQuery}
            setSearchQuery={logistics.setSearchQuery}
          />
        </TabsContent>

        <TabsContent value="nominations">
          <NominationsTable
            nominations={logistics.nominations}
            filter={logistics.nominationFilter}
            setFilter={logistics.setNominationFilter}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryGrid inventory={logistics.inventory} />
        </TabsContent>

        <TabsContent value="recon">
          <LogisticsRecon results={logistics.reconResults} stats={logistics.reconStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logistics;

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ESGKPIs } from '@/components/esg/ESGKPIs';
import { ESGDashboardView } from '@/components/esg/ESGDashboardView';
import { SupplierDDTab } from '@/components/esg/SupplierDDTab';
import { SourcingTab } from '@/components/esg/SourcingTab';
import { EmissionsTab } from '@/components/esg/EmissionsTab';
import { EnvProductsTab } from '@/components/esg/EnvProductsTab';
import { useESG } from '@/hooks/useESG';
import { Leaf } from 'lucide-react';

const ESGModule = () => {
  const { activeTab, setActiveTab, dueDiligence, sourcing, emissions, credits, emissionsTrend, kpis } = useESG();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Leaf className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">ESG & Responsible Sourcing</h1>
          <p className="text-sm text-muted-foreground">
            Supplier due diligence, responsible sourcing, carbon tracking & environmental products
          </p>
        </div>
      </div>

      <ESGKPIs {...kpis} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="dd">Supplier DD</TabsTrigger>
          <TabsTrigger value="sourcing">Responsible Sourcing</TabsTrigger>
          <TabsTrigger value="emissions">Carbon & Emissions</TabsTrigger>
          <TabsTrigger value="envproducts">Environmental Products</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <ESGDashboardView {...kpis} emissionsTrend={emissionsTrend} />
        </TabsContent>
        <TabsContent value="dd"><SupplierDDTab data={dueDiligence} /></TabsContent>
        <TabsContent value="sourcing"><SourcingTab data={sourcing} /></TabsContent>
        <TabsContent value="emissions"><EmissionsTab emissions={emissions} credits={credits} trend={emissionsTrend} /></TabsContent>
        <TabsContent value="envproducts"><EnvProductsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ESGModule;

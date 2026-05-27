import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { TaxKPIs } from '@/components/tax-controls/TaxKPIs';
import { TaxFilters } from '@/components/tax-controls/TaxFilters';
import { TaxCalcTable } from '@/components/tax-controls/TaxCalcTable';
import { TaxRulesTable } from '@/components/tax-controls/TaxRulesTable';
import { TaxExceptionsTable } from '@/components/tax-controls/TaxExceptionsTable';
import { useTaxControls } from '@/hooks/useTaxControls';

const TaxControls = () => {
  const {
    rules, calcs, exceptions,
    jurisdictions, taxTypes,
    jurisdictionFilter, setJurisdictionFilter,
    taxTypeFilter, setTaxTypeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    kpis,
  } = useTaxControls();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax / Duties / Levies Controls"
        description="Validate tax determination and reconcile expected vs actual across jurisdictions"
      />

      <TaxKPIs kpis={kpis} />

      <TaxFilters
        jurisdictionFilter={jurisdictionFilter} setJurisdictionFilter={setJurisdictionFilter}
        taxTypeFilter={taxTypeFilter} setTaxTypeFilter={setTaxTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        jurisdictions={jurisdictions} taxTypes={taxTypes}
      />

      <Tabs defaultValue="calcs">
        <TabsList>
          <TabsTrigger value="calcs">Tax Calculations ({calcs.length})</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions ({exceptions.length})</TabsTrigger>
          <TabsTrigger value="rules">Tax Rules ({rules.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="calcs">
          <TaxCalcTable calcs={calcs} />
        </TabsContent>
        <TabsContent value="exceptions">
          <TaxExceptionsTable exceptions={exceptions} />
        </TabsContent>
        <TabsContent value="rules">
          <TaxRulesTable rules={rules} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxControls;

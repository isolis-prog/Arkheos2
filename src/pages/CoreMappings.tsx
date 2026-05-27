import { PageHeader } from '@/components/ui/page-header';
import { MappingKPIs } from '@/components/core-mappings/MappingKPIs';
import { MappingFilters } from '@/components/core-mappings/MappingFilters';
import { MappingsTable } from '@/components/core-mappings/MappingsTable';
import { useCoreMappings } from '@/hooks/useCoreMappings';

const CoreMappings = () => {
  const { mappings, filters, setFilters, kpis } = useCoreMappings();

  return (
    <div className="space-y-6">
      <PageHeader title="Entity Mappings" description="Canonical ID resolution across source systems — search, create, and approve mappings" />
      <MappingKPIs {...kpis} />
      <MappingFilters filters={filters} onChange={setFilters} entityTypes={kpis.entityTypes} sourceSystems={kpis.sourceSystems} />
      <MappingsTable mappings={mappings} />
    </div>
  );
};

export default CoreMappings;

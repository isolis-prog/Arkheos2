import { PageHeader } from '@/components/ui/page-header';
import { useCloseCockpit } from '@/hooks/useCloseCockpit';
import { CloseCockpitKPIs } from '@/components/close-cockpit/CloseCockpitKPIs';
import { CloseCockpitFilters } from '@/components/close-cockpit/CloseCockpitFilters';
import { EntityTrafficLight } from '@/components/close-cockpit/EntityTrafficLight';
import { CloseTaskBoard } from '@/components/close-cockpit/CloseTaskBoard';
import { SignoffGatesPanel } from '@/components/close-cockpit/SignoffGatesPanel';
import { ClosePacksPanel } from '@/components/close-cockpit/ClosePacksPanel';
import { Skeleton } from '@/components/ui/skeleton';

const CloseCockpit = () => {
  const {
    periods,
    tasks,
    signoffs,
    packs,
    summary,
    filters,
    setFilters,
    legalEntities,
    categories,
    isLoading,
  } = useCloseCockpit();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Close Cockpit"
        description="SOX-ready period close orchestration with tasks, sign-offs, and evidence packs"
      />

      <CloseCockpitFilters
        filters={filters}
        onFiltersChange={setFilters}
        legalEntities={legalEntities}
        categories={categories}
        periods={periods}
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      ) : (
        <>
          <CloseCockpitKPIs summary={summary} />
          <EntityTrafficLight tasks={tasks} signoffs={signoffs} legalEntities={legalEntities} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SignoffGatesPanel signoffs={signoffs} />
            </div>
            <div>
              <ClosePacksPanel packs={packs} />
            </div>
          </div>

          <CloseTaskBoard tasks={tasks} />
        </>
      )}
    </div>
  );
};

export default CloseCockpit;

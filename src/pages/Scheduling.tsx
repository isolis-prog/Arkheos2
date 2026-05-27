import { PageHeader } from '@/components/ui/page-header';
import { useScheduling } from '@/hooks/useScheduling';
import { SchedulingFilters } from '@/components/scheduling/SchedulingFilters';
import { SchedulingKPIs } from '@/components/scheduling/SchedulingKPIs';
import { NominationsTableView } from '@/components/scheduling/NominationsTable';
import { NominationDetailPanel } from '@/components/scheduling/NominationDetailPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

const Scheduling = () => {
  const {
    nominations, filters, setFilters, selectedLine, selectedEvents,
    setSelectedLineId, commodities, locations, counterparties, books,
    kpis, topBreakLocations,
  } = useScheduling();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nominations & Scheduling"
        description="Reconcile contracted vs nominated vs executed deliveries across commodities"
      />

      <SchedulingKPIs kpis={kpis} />

      <SchedulingFilters
        filters={filters}
        onFiltersChange={setFilters}
        commodities={commodities}
        locations={locations}
        counterparties={counterparties}
        books={books}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedLine ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <NominationsTableView
            nominations={nominations}
            onSelect={(id) => setSelectedLineId(id === selectedLine?.id ? null : id)}
            selectedId={selectedLine?.id ?? null}
          />
        </div>

        {selectedLine && (
          <div className="lg:col-span-1">
            <NominationDetailPanel
              line={selectedLine}
              events={selectedEvents}
              onClose={() => setSelectedLineId(null)}
            />
          </div>
        )}
      </div>

      {/* Top break locations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Top Break Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {topBreakLocations.map(([loc, count]) => (
              <div key={loc} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm">{loc}</span>
                <Badge variant="destructive" className="text-xs">{count}</Badge>
              </div>
            ))}
            {topBreakLocations.length === 0 && (
              <p className="text-sm text-muted-foreground">No breaks detected</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scheduling;

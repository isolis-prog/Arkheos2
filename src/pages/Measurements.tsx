import { PageHeader } from '@/components/ui/page-header';
import { useMeasurements } from '@/hooks/useMeasurements';
import { MeasurementsFilters } from '@/components/measurements/MeasurementsFilters';
import { MeasurementsKPIs } from '@/components/measurements/MeasurementsKPIs';
import { ReconResultsTable } from '@/components/measurements/ReconResultsTable';
import { MeasurementDetailPanel } from '@/components/measurements/MeasurementDetailPanel';
import { UomConversionsCard } from '@/components/measurements/UomConversionsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge } from 'lucide-react';

const Measurements = () => {
  const {
    reconResults, conversions, filters, setFilters,
    selectedResult, selectedMeasurement, setSelectedResultId,
    locations, meterIds, commodities,
    kpis, topOutlierMeters,
  } = useMeasurements();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metering & Measurement Recon"
        description="Reconcile actual measurements (meters, tickets, B/L) vs ETRM/ERP for true-ups"
      />

      <MeasurementsKPIs kpis={kpis} />

      <Tabs defaultValue="recon" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recon">Reconciliation</TabsTrigger>
          <TabsTrigger value="conversions">UoM Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="recon" className="space-y-4">
          <MeasurementsFilters
            filters={filters}
            onFiltersChange={setFilters}
            locations={locations}
            meterIds={meterIds}
            commodities={commodities}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={selectedResult ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <ReconResultsTable
                results={reconResults}
                onSelect={(id) => setSelectedResultId(id === selectedResult?.id ? null : id)}
                selectedId={selectedResult?.id ?? null}
              />
            </div>

            {selectedResult && (
              <div className="lg:col-span-1">
                <MeasurementDetailPanel
                  result={selectedResult}
                  measurement={selectedMeasurement}
                  onClose={() => setSelectedResultId(null)}
                />
              </div>
            )}
          </div>

          {/* Top outlier meters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4" /> Top Meters by Imbalance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {topOutlierMeters.map(([meter, data]) => (
                  <div key={meter} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <span className="text-sm font-mono">{meter}</span>
                    <Badge variant="destructive" className="text-xs">${(data.delta / 1000).toFixed(0)}K</Badge>
                    <span className="text-xs text-muted-foreground">{data.count} events</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <UomConversionsCard conversions={conversions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Measurements;

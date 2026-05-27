import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Thermometer, FileText, X, Scale } from 'lucide-react';
import { format } from 'date-fns';
import type { ReconResult, MeasurementEvent } from '@/hooks/useMeasurements';

interface Props {
  result: ReconResult;
  measurement: MeasurementEvent | null;
  onClose: () => void;
}

export const MeasurementDetailPanel = ({ result, measurement, onClose }: Props) => {
  const isBreak = result.status === 'pending' || result.status === 'disputed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{result.meterId}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Recon Summary */}
      <Card className={isBreak ? 'border-destructive/30 bg-destructive/5' : 'border-border'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isBreak ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            Reconciliation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={result.status === 'disputed' ? 'destructive' : result.status === 'matched' ? 'default' : 'secondary'}>
              {result.status.toUpperCase()}
            </Badge>
            {result.adjustmentType && <Badge variant="outline" className="capitalize">{result.adjustmentType}</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Expected</p>
              <p className="font-mono font-semibold">{result.expectedQty.toLocaleString()} {result.expectedUom}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Actual</p>
              <p className="font-mono font-semibold">{result.actualQty.toLocaleString()} {result.actualUom}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Delta</p>
              <p className={`font-mono font-semibold ${result.delta < 0 ? 'text-destructive' : ''}`}>
                {result.delta.toLocaleString()} ({result.deltaPct?.toFixed(2)}%)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. Value Impact</p>
              <p className={`font-mono font-semibold ${result.deltaValueEst < 0 ? 'text-destructive' : ''}`}>
                ${Math.abs(result.deltaValueEst).toLocaleString()}
              </p>
            </div>
          </div>
          {result.notes && <p className="text-sm text-muted-foreground italic">{result.notes}</p>}
        </CardContent>
      </Card>

      {/* Measurement Details */}
      {measurement && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4" /> Measurement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Source:</span> <span className="capitalize">{measurement.source.replace(/_/g, ' ')}</span></div>
              <div><span className="text-muted-foreground">System:</span> {measurement.sourceSystem}</div>
              <div><span className="text-muted-foreground">Doc Ref:</span> <span className="font-mono">{measurement.docRef}</span></div>
              <div><span className="text-muted-foreground">Date:</span> {format(new Date(measurement.measurementDt), 'dd MMM yyyy HH:mm')}</div>
            </div>
            {(measurement.temperature != null || measurement.density != null) && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Physical:</span>
                  {measurement.temperature != null && <span>Temp: {measurement.temperature}°</span>}
                  {measurement.density != null && <span>Density: {measurement.density}</span>}
                </div>
              </>
            )}
            {Object.keys(measurement.qualityAttrs).length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-xs">Quality Attributes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(measurement.qualityAttrs).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs font-mono">{k}: {String(v)}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* True-up Journal */}
      {result.trueUpJournal && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> True-Up Journal Proposal</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground">Debit</div>
              <div className="text-muted-foreground">Credit</div>
              <div className="text-muted-foreground text-right">Amount</div>
              <div>{result.trueUpJournal.debit}</div>
              <div>{result.trueUpJournal.credit}</div>
              <div className="text-right">${result.trueUpJournal.amount.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Evidence
            {result.evidenceRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.evidenceRefs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {result.evidenceRefs.map((ref) => (
                <Badge key={ref} variant="secondary" className="font-mono text-xs">{ref}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence attached yet</p>
          )}
        </CardContent>
      </Card>

      <Separator />
      <div className="flex gap-2">
        {isBreak && (
          <>
            <Button size="sm" variant="destructive">Create Exception</Button>
            <Button size="sm" variant="outline">Resolve</Button>
          </>
        )}
        <Button size="sm" variant="outline">Generate True-Up</Button>
        <Button size="sm" variant="outline" className="ml-auto">Export</Button>
      </div>
    </div>
  );
};

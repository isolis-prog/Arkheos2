import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FlaskConical, FileWarning, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StageBadge } from '@/components/confirmations/StageBadge';
import {
  simulateMatching,
  parseFileContent,
  DEFAULT_FIELD_RULES,
  type SimDoc,
  type SimResult,
  type SimPair,
} from '@/lib/confirmations/simulateMatching';

function FileDropzone({
  label,
  hint,
  onLoad,
  loadedCount,
  filename,
}: {
  label: string;
  hint: string;
  onLoad: (docs: SimDoc[], name: string) => void;
  loadedCount: number;
  filename: string | null;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const docs = parseFileContent(file.name, text);
      if (docs.length === 0) {
        toast.warning(`${file.name} contained no rows`);
        return;
      }
      onLoad(docs, file.name);
      toast.success(`Loaded ${docs.length} rows from ${file.name}`);
    } catch (e) {
      toast.error(`Failed to parse ${file.name}`, { description: (e as Error).message });
    }
  };

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Label
        htmlFor={`file-${label}`}
        className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        Choose file
      </Label>
      <Input
        id={`file-${label}`}
        type="file"
        accept=".csv,.json,application/json,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {filename && (
        <p className="mt-2 text-xs text-success">
          ✓ {filename} — {loadedCount} rows
        </p>
      )}
    </div>
  );
}

function PairRow({ pair, onSelect, isSelected }: { pair: SimPair; onSelect: () => void; isSelected: boolean }) {
  return (
    <TableRow
      className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
      onClick={onSelect}
    >
      <TableCell className="font-mono text-xs">
        {pair.ourDoc?.externalRef ?? pair.counterpartyDoc?.externalRef}
      </TableCell>
      <TableCell>
        <StageBadge stage={pair.stage} />
      </TableCell>
      <TableCell className="text-xs">{pair.ourDoc?.productCode ?? pair.counterpartyDoc?.productCode ?? '—'}</TableCell>
      <TableCell className="text-right font-mono text-xs">{pair.fieldDiscrepancyCount}</TableCell>
      <TableCell className="text-right font-mono text-xs">
        {pair.materialDiscrepancyCount > 0 ? (
          <StatusBadge variant="error">{pair.materialDiscrepancyCount} material</StatusBadge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function MatchingSimulatorPage() {
  const navigate = useNavigate();
  const [ourDocs, setOurDocs] = useState<SimDoc[]>([]);
  const [theirDocs, setTheirDocs] = useState<SimDoc[]>([]);
  const [ourFilename, setOurFilename] = useState<string | null>(null);
  const [theirFilename, setTheirFilename] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  const canRun = ourDocs.length > 0 && theirDocs.length > 0;

  const run = () => {
    const r = simulateMatching(ourDocs, theirDocs, DEFAULT_FIELD_RULES);
    setResult(r);
    setSelectedPair(r.pairs[0]?.pairKey ?? null);
    toast.success(`Simulation complete: ${r.matched} matched · ${r.disputed} disputed`);
  };

  const reset = () => {
    setOurDocs([]);
    setTheirDocs([]);
    setOurFilename(null);
    setTheirFilename(null);
    setResult(null);
    setSelectedPair(null);
  };

  const focused = useMemo(
    () => result?.pairs.find((p) => p.pairKey === selectedPair) ?? null,
    [result, selectedPair],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Simulator"
        description="Upload our_capture and counterparty files to preview proposed pairs, discrepancies, and the exact tolerances applied"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/confirmations-recon')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              Reset
            </Button>
            <Button size="sm" onClick={run} disabled={!canRun}>
              <FlaskConical className="h-3.5 w-3.5" />
              Run simulation
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FileDropzone
          label="Our capture"
          hint="CSV or JSON with trade_date, product_code, counterparty_id and field attributes"
          onLoad={(docs, name) => {
            setOurDocs(docs);
            setOurFilename(name);
          }}
          loadedCount={ourDocs.length}
          filename={ourFilename}
        />
        <FileDropzone
          label="Counterparty confirmation"
          hint="Same format — fields will be compared against our_capture row-by-row"
          onLoad={(docs, name) => {
            setTheirDocs(docs);
            setTheirFilename(name);
          }}
          loadedCount={theirDocs.length}
          filename={theirFilename}
        />
      </div>

      {!result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <FileWarning className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Load both files and click <span className="font-medium text-foreground">Run simulation</span> to preview matching results.
              The simulator uses the standard field rules (notional ±0.01%, prices ±0.001%, dates exact, day_count normalized).
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Matched</p>
                <p className="text-2xl font-semibold text-success">{result.matched}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Disputed</p>
                <p className="text-2xl font-semibold text-destructive">{result.disputed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Awaiting us</p>
                <p className="text-2xl font-semibold text-warning">{result.awaitingUs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Awaiting counterparty</p>
                <p className="text-2xl font-semibold text-warning">{result.awaitingCpty}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Rules applied</p>
                <p className="text-2xl font-semibold text-foreground">{result.rulesUsed}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Proposed pairs ({result.pairs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Fields</TableHead>
                      <TableHead className="text-right">Material</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.pairs.map((p) => (
                      <PairRow
                        key={p.pairKey}
                        pair={p}
                        isSelected={selectedPair === p.pairKey}
                        onSelect={() => setSelectedPair(p.pairKey)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {focused?.stage === 'matched' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  Pair detail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!focused ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Select a pair to inspect.</p>
                ) : (
                  <Tabs defaultValue="discrepancies" className="p-4">
                    <TabsList>
                      <TabsTrigger value="discrepancies">
                        Discrepancies ({focused.discrepancies.length})
                      </TabsTrigger>
                      <TabsTrigger value="docs">Side-by-side</TabsTrigger>
                    </TabsList>
                    <TabsContent value="discrepancies" className="mt-3">
                      {focused.discrepancies.length === 0 ? (
                        <p className="rounded-md border border-dashed p-6 text-center text-sm text-success">
                          All compared fields match within tolerances.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>Our</TableHead>
                              <TableHead>Counterparty</TableHead>
                              <TableHead>Tolerance applied</TableHead>
                              <TableHead>Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {focused.discrepancies.map((d) => (
                              <TableRow key={d.fieldName}>
                                <TableCell className="font-mono text-xs">
                                  {d.fieldName}
                                  {d.isMaterial && (
                                    <StatusBadge variant="error" className="ml-2">
                                      Material
                                    </StatusBadge>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{d.ourValue ?? '—'}</TableCell>
                                <TableCell className="font-mono text-xs">{d.counterpartyValue ?? '—'}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {d.toleranceApplied}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge variant={d.type === 'format_only' ? 'warning' : 'error'}>
                                    {d.type.replace(/_/g, ' ')}
                                  </StatusBadge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    <TabsContent value="docs" className="mt-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border bg-muted/30 p-3">
                          <p className="mb-2 font-semibold">Our capture</p>
                          <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px]">
                            {focused.ourDoc ? JSON.stringify(focused.ourDoc.attributes, null, 2) : '— no document —'}
                          </pre>
                        </div>
                        <div className="rounded-md border bg-muted/30 p-3">
                          <p className="mb-2 font-semibold">Counterparty</p>
                          <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px]">
                            {focused.counterpartyDoc ? JSON.stringify(focused.counterpartyDoc.attributes, null, 2) : '— no document —'}
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

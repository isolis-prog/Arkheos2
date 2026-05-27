import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { HedgeRelationship, HedgeTestResult, HedgeAccountingPack } from '@/hooks/useHedgeAccounting';

interface Props {
  relationship: HedgeRelationship;
  tests: HedgeTestResult[];
  packs: HedgeAccountingPack[];
  onBack: () => void;
}

const fmt = (v: number) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
};

export const RelationshipDetailPanel = ({ relationship: rel, tests, packs, onBack }: Props) => {
  const checklistEntries = Object.entries(rel.documentationChecklist);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-semibold">{rel.designationRef}</h2>
          <p className="text-sm text-muted-foreground">{rel.exposureDescription}</p>
        </div>
        <Badge className="ml-auto" variant="outline">{rel.accountingStandard}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Method</p><p className="font-semibold">{rel.method.replace('_', ' ')}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Notional</p><p className="font-semibold">{fmt(rel.notionalAmount)} {rel.currency}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Hedge Ratio</p><p className="font-semibold">{(rel.hedgeRatio * 100).toFixed(0)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Instruments</p><p className="font-semibold">{rel.hedgeTradeIds.join(', ')}</p></CardContent></Card>
      </div>

      {/* SoD info */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Segregation of Duties</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Designated By</p><p className="text-sm font-medium">{rel.designatedBy}</p><p className="text-xs text-muted-foreground">{rel.designationDate}</p></div>
            <div><p className="text-xs text-muted-foreground">Approved By</p><p className="text-sm font-medium">{rel.approvedBy ?? <span className="text-warning">Pending approval</span>}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation checklist */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Documentation Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            {checklistEntries.map(([key, done]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                {done ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <span className={done ? '' : 'text-destructive font-medium'}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Effectiveness tests */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Effectiveness Tests</CardTitle></CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tests recorded</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-center">Pass</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{t.testType}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(t.periodStart), 'dd MMM')} – {format(new Date(t.periodEnd), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.methodDetail}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${t.passFlag ? 'text-success' : 'text-destructive font-bold'}`}>{(t.effectivenessRatio * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{t.passFlag ? <CheckCircle className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounting Packs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Accounting Packs</CardTitle>
        </CardHeader>
        <CardContent>
          {packs.length === 0 ? (
            <div className="flex flex-col items-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No packs generated</p>
              <Button variant="outline" size="sm">Generate Pack</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {packs.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{p.packRef}</p>
                    <p className="text-xs text-muted-foreground">{p.period} · {p.standard}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === 'exported' ? 'default' : p.status === 'approved' ? 'secondary' : 'outline'} className="text-xs">{p.status}</Badge>
                    <Button variant="outline" size="sm">Export</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

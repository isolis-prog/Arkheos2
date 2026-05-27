import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, ShieldAlert, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { StageBadge } from '@/components/confirmations/StageBadge';
import { SLABreachBadge } from '@/components/confirmations/SLABreachBadge';
import type { ConfirmationStage, FieldCategory } from '@/hooks/confirmations/types';

interface BlockingTrade {
  tradeConfirmationId: string;
  runId: string;
  dealId: string;
  stage: ConfirmationStage;
  fieldDiscrepancyCount: number;
  materialDiscrepancyCount: number;
  slaBreachAt: string | null;
  lastActionAt: string | null;
  blockingFields: Array<{
    fieldName: string;
    fieldCategory: FieldCategory;
    ourValue: string | null;
    counterpartyValue: string | null;
    toleranceApplied: string | null;
  }>;
}

function useBlockingTrades(asOfDate: string) {
  return useQuery({
    queryKey: ['confirmations', 'close-ready', asOfDate],
    queryFn: async (): Promise<BlockingTrade[]> => {
      const { data: statusRows, error: stErr } = await supabase
        .from('trade_confirmation_status')
        .select('*')
        .eq('blocking_settlement', true)
        .order('sla_breach_at', { ascending: true, nullsFirst: false });
      if (stErr) throw stErr;
      const rows = statusRows ?? [];
      if (rows.length === 0) return [];

      const dealKeys = rows.map((r) => `${r.run_id}|${r.deal_id}`);
      const runIds = Array.from(new Set(rows.map((r) => r.run_id).filter(Boolean))) as string[];
      const dealIds = Array.from(new Set(rows.map((r) => r.deal_id)));

      const { data: discRows, error: dErr } = await supabase
        .from('confirmation_discrepancies')
        .select('run_id, deal_id, field_name, field_category, our_value, counterparty_value, tolerance_applied, is_material, status')
        .in('run_id', runIds.length ? runIds : ['00000000-0000-0000-0000-000000000000'])
        .in('deal_id', dealIds.length ? dealIds : ['__none__'])
        .eq('is_material', true)
        .neq('status', 'resolved')
        .neq('status', 'accepted_as_is');
      if (dErr) throw dErr;

      const discMap = new Map<string, BlockingTrade['blockingFields']>();
      (discRows ?? []).forEach((d) => {
        const k = `${d.run_id}|${d.deal_id}`;
        if (!dealKeys.includes(k)) return;
        const arr = discMap.get(k) ?? [];
        arr.push({
          fieldName: d.field_name as string,
          fieldCategory: (d.field_category as FieldCategory) ?? 'other',
          ourValue: (d.our_value as string) ?? null,
          counterpartyValue: (d.counterparty_value as string) ?? null,
          toleranceApplied: (d.tolerance_applied as string) ?? null,
        });
        discMap.set(k, arr);
      });

      return rows.map((r) => ({
        tradeConfirmationId: r.trade_confirmation_id,
        runId: r.run_id ?? '',
        dealId: r.deal_id,
        stage: (r.stage as ConfirmationStage) ?? 'disputed',
        fieldDiscrepancyCount: Number(r.field_discrepancy_count ?? 0),
        materialDiscrepancyCount: Number(r.material_discrepancy_count ?? 0),
        slaBreachAt: r.sla_breach_at,
        lastActionAt: r.last_action_at,
        blockingFields: discMap.get(`${r.run_id}|${r.deal_id}`) ?? [],
      }));
    },
  });
}

function downloadCSV(trades: BlockingTrade[], asOfDate: string) {
  const header = ['deal_id', 'stage', 'material_discrepancies', 'sla_breach_at', 'blocking_field', 'category', 'our_value', 'counterparty_value', 'tolerance'];
  const rows: string[][] = [header];
  trades.forEach((t) => {
    if (t.blockingFields.length === 0) {
      rows.push([t.dealId, t.stage, String(t.materialDiscrepancyCount), t.slaBreachAt ?? '', '', '', '', '', '']);
    }
    t.blockingFields.forEach((f) => {
      rows.push([
        t.dealId,
        t.stage,
        String(t.materialDiscrepancyCount),
        t.slaBreachAt ?? '',
        f.fieldName,
        f.fieldCategory,
        f.ourValue ?? '',
        f.counterpartyValue ?? '',
        f.toleranceApplied ?? '',
      ]);
    });
  });
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `close-ready-blocking-${asOfDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CloseReadyReportPage() {
  const navigate = useNavigate();
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [asOfDate, setAsOfDate] = useState(today);
  const { data: trades = [], isLoading } = useBlockingTrades(asOfDate);

  const summary = useMemo(() => {
    const byCategory = new Map<FieldCategory, number>();
    let totalFields = 0;
    trades.forEach((t) => {
      t.blockingFields.forEach((f) => {
        byCategory.set(f.fieldCategory, (byCategory.get(f.fieldCategory) ?? 0) + 1);
        totalFields += 1;
      });
    });
    return { totalTrades: trades.length, totalFields, byCategory };
  }, [trades]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Close-Ready Report"
        description="Trades flagged blocking_settlement=true and the specific fields driving the halt"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/confirmations-recon')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => downloadCSV(trades, asOfDate)}
              disabled={trades.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label htmlFor="asof">As-of date</Label>
            <Input
              id="asof"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Blocking trades: </span>
              <span className="font-mono font-semibold text-destructive">{summary.totalTrades}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Material fields: </span>
              <span className="font-mono font-semibold text-foreground">{summary.totalFields}</span>
            </div>
            {Array.from(summary.byCategory.entries()).map(([cat, n]) => (
              <StatusBadge key={cat} variant="warning">
                {cat}: {n}
              </StatusBadge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Trades blocking close
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : trades.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
              No trades currently blocking settlement. The book is close-ready.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal ID</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Material</TableHead>
                  <TableHead>Blocking fields</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((t) => (
                  <TableRow key={`${t.runId}-${t.dealId}`}>
                    <TableCell className="font-mono text-xs font-medium">{t.dealId}</TableCell>
                    <TableCell>
                      <StageBadge stage={t.stage} />
                    </TableCell>
                    <TableCell>
                      <SLABreachBadge slaBreachAt={t.slaBreachAt} blockingSettlement />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {t.materialDiscrepancyCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.blockingFields.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No active material discrepancies recorded</span>
                        ) : (
                          t.blockingFields.slice(0, 4).map((f) => (
                            <StatusBadge key={f.fieldName} variant="error">
                              {f.fieldName}
                            </StatusBadge>
                          ))
                        )}
                        {t.blockingFields.length > 4 && (
                          <StatusBadge variant="muted">+{t.blockingFields.length - 4}</StatusBadge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/confirmations-recon/${t.runId}/trades/${encodeURIComponent(t.dealId)}`)}
                      >
                        Open detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocking field detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Our value</TableHead>
                  <TableHead>Counterparty value</TableHead>
                  <TableHead>Tolerance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.flatMap((t) =>
                  t.blockingFields.map((f) => (
                    <TableRow key={`${t.dealId}-${f.fieldName}`}>
                      <TableCell className="font-mono text-xs">{t.dealId}</TableCell>
                      <TableCell className="font-mono text-xs">{f.fieldName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.fieldCategory}</TableCell>
                      <TableCell className="font-mono text-xs">{f.ourValue ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{f.counterpartyValue ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{f.toleranceApplied ?? '—'}</TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

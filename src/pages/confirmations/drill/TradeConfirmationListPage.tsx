import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DrillDownTable, type DrillColumn } from '@/components/drill';
import { DrillPageShell, DrillPageLoadingSkeleton } from '@/pages/reconciliations/drill/DrillPageShell';
import { StageBadge } from '@/components/confirmations/StageBadge';
import { SLABreachBadge } from '@/components/confirmations/SLABreachBadge';
import { useConfirmationByDeal, type ConfirmationByDealRow } from '@/hooks/confirmations/useConfirmationByDeal';
import {
  buildConfirmationDrillUrl,
  buildConfirmationPath,
  confirmationScopeToHeader,
  useConfirmationDrillAudit,
  useConfirmationDrillScope,
} from './_drillScope';

const STAGE_OPTIONS = [
  'matched',
  'disputed',
  'awaiting_counterparty',
  'awaiting_us',
  'amended',
  'cancelled',
];

export default function TradeConfirmationListPage() {
  const navigate = useNavigate();
  const { runId = '' } = useParams<{ runId: string }>();
  const { scope, setScope, removeKey } = useConfirmationDrillScope(runId);

  const { data: rows, isLoading } = useConfirmationByDeal(runId, {
    stage: scope.stage,
    counterpartyId: scope.counterpartyId,
    productCode: scope.productCode,
    blockingSettlement: scope.blockingSettlement,
  });

  useConfirmationDrillAudit('view', 5, scope, rows.length);

  const path = useMemo(() => buildConfirmationPath(5, scope), [scope]);

  const columns: DrillColumn<ConfirmationByDealRow>[] = [
    { key: 'dealId', header: 'Deal ID', accessor: (r) => r.dealId, sortable: true, width: 200 },
    { key: 'cpty', header: 'Counterparty', accessor: (r) => r.counterpartyName, sortable: true },
    { key: 'product', header: 'Product', accessor: (r) => r.productCode ?? '—', sortable: true, width: 130 },
    { key: 'stage', header: 'Stage', accessor: (r) => <StageBadge stage={r.stage} />, width: 180 },
    {
      key: 'fields',
      header: 'Fields',
      accessor: (r) => r.fieldDiscrepancyCount,
      align: 'right',
      sortable: true,
      format: 'number',
      width: 90,
    },
    {
      key: 'material',
      header: 'Material',
      accessor: (r) => r.materialDiscrepancyCount,
      align: 'right',
      sortable: true,
      format: 'number',
      width: 100,
    },
    {
      key: 'sla',
      header: 'SLA',
      accessor: (r) => <SLABreachBadge slaBreachAt={r.slaBreachAt} blockingSettlement={r.blockingSettlement} />,
      width: 220,
    },
    {
      key: 'lastAction',
      header: 'Last action',
      accessor: (r) => (r.lastActionAt ? new Date(r.lastActionAt).toLocaleString() : '—'),
      width: 180,
    },
  ];

  return (
    <DrillPageShell
      title="Trade confirmations"
      subtitle="Per-trade confirmation status with field-level discrepancy counts and SLA tracking."
      level={5}
      module="confirmations_recon"
      path={path}
      scope={confirmationScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() => navigate('/confirmations-recon')}
      onRemoveScope={(key) => removeKey(key as never)}
      onResetScope={() => setScope({ runId })}
      exportScope={scope as unknown as Record<string, unknown>}
      estimatedRowCount={rows.length}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={scope.stage ?? 'all'}
            onValueChange={(v) => setScope({ ...scope, stage: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="blocking"
              checked={scope.blockingSettlement ?? false}
              onCheckedChange={(v) => setScope({ ...scope, blockingSettlement: v || undefined })}
            />
            <Label htmlFor="blocking" className="text-sm">Blocking only</Label>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <DrillPageLoadingSkeleton rows={10} />
      ) : (
        <DrillDownTable
          rows={rows}
          columns={columns}
          pageSize={50}
          onRowClick={(row) =>
            navigate(buildConfirmationDrillUrl(`/confirmations-recon/${runId}/trades/${encodeURIComponent(row.dealId)}`, scope))
          }
        />
      )}
    </DrillPageShell>
  );
}

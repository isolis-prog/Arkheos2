import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DrillPageShell, DrillPageLoadingSkeleton } from '@/pages/reconciliations/drill/DrillPageShell';
import { StageBadge } from '@/components/confirmations/StageBadge';
import { SLABreachBadge } from '@/components/confirmations/SLABreachBadge';
import { MultiBreakIndicator } from '@/components/confirmations/MultiBreakIndicator';
import { ConfirmationDocumentSideBySide } from '@/components/confirmations/ConfirmationDocumentSideBySide';
import { FieldDiscrepancyTable } from '@/components/confirmations/FieldDiscrepancyTable';
import { ConfirmationTimeline } from '@/components/confirmations/ConfirmationTimeline';
import { useConfirmationDealDetail } from '@/hooks/confirmations/useConfirmationDealDetail';
import {
  useResolveDiscrepancy,
  useAcceptDiscrepancyAsIs,
  useFlagFalsePositive,
  useEscalateTrade,
  useRejectDiscrepancy,
  useRequestAmendment,
  useReopenDiscrepancy,
} from '@/hooks/confirmations/useConfirmationMutations';
import {
  buildConfirmationPath,
  confirmationScopeToHeader,
  useConfirmationDrillAudit,
  useConfirmationDrillScope,
} from './_drillScope';
import type { ConfirmationDiscrepancy } from '@/hooks/confirmations/types';

export default function TradeConfirmationDetailPage() {
  const navigate = useNavigate();
  const { runId = '', dealId = '' } = useParams<{ runId: string; dealId: string }>();
  const { scope } = useConfirmationDrillScope(runId);
  const detail = useConfirmationDealDetail(runId, dealId);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const resolveMut = useResolveDiscrepancy();
  const acceptMut = useAcceptDiscrepancyAsIs();
  const flagMut = useFlagFalsePositive();
  const escalateMut = useEscalateTrade();
  const rejectMut = useRejectDiscrepancy();
  const amendMut = useRequestAmendment();
  const reopenMut = useReopenDiscrepancy();

  useConfirmationDrillAudit('view', 6, scope);

  const path = useMemo(() => {
    const base = buildConfirmationPath(5, scope);
    base.push({
      level: base.length,
      label: dealId,
      scope: { dealId },
      href: `/confirmations-recon/${runId}/trades/${dealId}`,
    });
    return base;
  }, [scope, dealId, runId]);

  const status = detail.data?.status;
  const discrepancies = detail.data?.discrepancies ?? [];
  const ourDoc = detail.data?.ourDoc ?? null;
  const cpDoc = detail.data?.counterpartyDoc ?? null;
  const awaitingSide = !ourDoc ? 'us' : !cpDoc ? 'counterparty' : null;
  const highlightFields = highlightedField ? [highlightedField] : [];

  const handleResolve = (d: ConfirmationDiscrepancy) => {
    const note = window.prompt(`Resolution note for "${d.fieldName}":`);
    if (!note) return;
    resolveMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, resolutionNote: note });
  };
  const handleAccept = (d: ConfirmationDiscrepancy) => {
    const just = window.prompt(`Justification to accept "${d.fieldName}" as-is:`);
    if (!just) return;
    acceptMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, justification: just });
  };
  const handleFlag = (d: ConfirmationDiscrepancy) => {
    const reason = window.prompt(`Reason for flagging "${d.fieldName}" as false positive (optional):`) ?? undefined;
    flagMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, fieldName: d.fieldName, reason });
  };
  const handleReject = (d: ConfirmationDiscrepancy) => {
    const reason = window.prompt(`Reason to reject (ours stands) for "${d.fieldName}":`);
    if (!reason) return;
    rejectMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, reason });
  };
  const handleAmend = (d: ConfirmationDiscrepancy) => {
    const rationale = window.prompt(`Rationale for amendment on "${d.fieldName}":`);
    if (!rationale) return;
    amendMut.mutate({
      discrepancyId: d.discrepancyId,
      runId,
      dealId,
      fieldName: d.fieldName,
      ourValue: d.ourValue,
      counterpartyValue: d.counterpartyValue,
      rationale,
    });
  };
  const handleReopen = (d: ConfirmationDiscrepancy) => {
    const reason = window.prompt(`Reason to reopen "${d.fieldName}" (optional):`) ?? undefined;
    reopenMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, reason });
  };
  const handleEscalateRow = (d: ConfirmationDiscrepancy) => {
    if (!status) return;
    escalateMut.mutate({
      runId,
      dealId,
      tradeConfirmationId: status.tradeConfirmationId,
      note: `Escalated from field "${d.fieldName}"`,
    });
  };
  const handleEscalate = () => {
    if (!status) return;
    escalateMut.mutate({
      runId,
      dealId,
      tradeConfirmationId: status.tradeConfirmationId,
      note: 'Escalated from L6 detail',
    });
  };
  const handleResolveAllNonMaterial = () => {
    discrepancies.filter((d) => !d.isMaterial && d.status === 'open').forEach((d) =>
      resolveMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, resolutionNote: 'Bulk: non-material' }),
    );
  };
  const handleAcceptAllFormatOnly = () => {
    discrepancies.filter((d) => d.discrepancyType === 'format_only' && d.status === 'open').forEach((d) =>
      acceptMut.mutate({ discrepancyId: d.discrepancyId, runId, dealId, justification: 'Bulk: format-only normalization' }),
    );
  };

  return (
    <DrillPageShell
      title={`Confirmation · ${dealId}`}
      subtitle={status ? `${status.fieldDiscrepancyCount} field discrepanc${status.fieldDiscrepancyCount === 1 ? 'y' : 'ies'} · ${status.materialDiscrepancyCount} material` : undefined}
      level={6}
      module="confirmations_recon"
      path={path}
      scope={confirmationScopeToHeader(scope)}
      onBreadcrumbNavigate={(node) => navigate(node.href)}
      onBackToParent={() => navigate(`/confirmations-recon/${runId}/trades`)}
      exportScope={{ runId, dealId } as Record<string, unknown>}
      estimatedRowCount={discrepancies.length}
      actions={
        status && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResolveAllNonMaterial}>
              Approve all non-material
            </Button>
            <Button variant="outline" size="sm" onClick={handleEscalate}>
              <ShieldAlert className="h-3.5 w-3.5" />
              Escalate to counterparty
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/trade-explorer/${encodeURIComponent(dealId)}`)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Trade Explorer
            </Button>
          </div>
        )
      }
    >
      {detail.isLoading ? (
        <DrillPageLoadingSkeleton rows={8} />
      ) : !status ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No confirmation status found for this deal in this run.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header summary */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-foreground">{dealId}</span>
                <StageBadge stage={status.stage} />
                <SLABreachBadge slaBreachAt={status.slaBreachAt} blockingSettlement={status.blockingSettlement} />
                {ourDoc?.notional != null && (
                  <span className="text-sm text-muted-foreground">
                    Notional: <span className="font-mono text-foreground">{ourDoc.notional.toLocaleString()} {ourDoc.currency ?? ''}</span>
                  </span>
                )}
              </div>
              <MultiBreakIndicator counts={{ confirmation: status.materialDiscrepancyCount }} />
            </CardContent>
          </Card>

          {/* 60/40 split: documents + discrepancies */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ConfirmationDocumentSideBySide
                ourDoc={ourDoc}
                counterpartyDoc={cpDoc}
                highlightFields={highlightFields}
                awaitingSide={awaitingSide}
              />
            </div>
            <div className="xl:col-span-2">
              <FieldDiscrepancyTable
                discrepancies={discrepancies}
                highlightedFieldName={highlightedField}
                onRowClick={(d) => setHighlightedField((prev) => (prev === d.fieldName ? null : d.fieldName))}
                onResolve={handleResolve}
                onAccept={handleAccept}
                onReject={handleReject}
                onAmend={handleAmend}
                onEscalate={handleEscalateRow}
                onReopen={handleReopen}
                onFlagFalsePositive={handleFlag}
                onResolveAllNonMaterial={handleResolveAllNonMaterial}
                onAcceptAllFormatOnly={handleAcceptAllFormatOnly}
              />
            </div>
          </div>

          {/* Timeline */}
          <ConfirmationTimeline
            tradeConfirmationId={status.tradeConfirmationId}
            ourDocReceivedAt={ourDoc?.receivedAt ?? null}
            counterpartyDocReceivedAt={cpDoc?.receivedAt ?? null}
            matchedAt={status.stage === 'matched' ? status.lastActionAt : null}
            discrepancyCount={discrepancies.length}
          />
        </div>
      )}
    </DrillPageShell>
  );
}

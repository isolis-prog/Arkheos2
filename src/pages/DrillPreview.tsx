import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BreakDetailPanel,
  DocumentTradeLineage,
  DrillBreadcrumb,
  DrillDownTable,
  ExportScopeButton,
  ScopeHeader,
  type BreakDetailView,
  type DrillColumn,
  type DrillPathNode,
  type DrillScope,
} from '@/components/drill';

type PreviewRow = {
  id: string;
  entity: string;
  breakCount: number;
  exposure: number;
  deltaPct: number;
  currency: string;
  status: string;
};

const breadcrumbPath: DrillPathNode[] = [
  { level: 0, label: 'Runs', scope: {}, href: '/runs' },
  { level: 1, label: '2026-03 close', scope: { runId: 'RUN-2026-03' }, href: '/runs/RUN-2026-03' },
  { level: 2, label: 'Amount mismatch', scope: { breakCategory: 'amount_mismatch' }, href: '/breaks/amount_mismatch' },
  { level: 3, label: 'EU Crude Desk', scope: { desk: 'EU Crude' }, href: '/desk/eu-crude' },
  { level: 4, label: 'Glencore', scope: { counterparty: 'Glencore' }, href: '/cp/glencore' },
  { level: 5, label: 'INV-440198', scope: { docId: 'INV-440198' }, href: '/doc/inv-440198' },
];

const scope: DrillScope = {
  runId: { label: 'Run', value: 'RUN-2026-03' },
  category: { label: 'Category', value: 'Amount mismatch', removable: true },
  entity: { label: 'Entity', value: 'EU Crude Desk', removable: true },
  counterparty: { label: 'Counterparty', value: 'Glencore', removable: true },
};

const rows: PreviewRow[] = Array.from({ length: 18 }).map((_, index) => ({
  id: `row-${index + 1}`,
  entity: ['EU Crude Desk', 'US Products', 'Asia LNG'][index % 3],
  breakCount: 8 + index,
  exposure: 125000 + index * 9800,
  deltaPct: 0.012 + index * 0.001,
  currency: 'USD',
  status: index % 2 === 0 ? 'open' : 'in_progress',
}));

const breakDetail: BreakDetailView = {
  id: 'bd-001',
  breakId: 'BRK-INV-440198',
  exceptionId: '00000000-0000-0000-0000-000000000000',
  status: 'in_progress',
  title: 'Invoice amount diverges from ERP voucher',
  currency: 'USD',
  sideA: {
    id: 'ERP-VCH-440198',
    label: 'ERP Voucher',
    amount: 128500,
    currency: 'USD',
    date: '2026-03-29',
    reference: 'VCH-440198',
    fields: {
      source: 'ERP',
      legalEntity: 'Arkhe EU Trading',
      counterparty: 'Glencore',
      docId: 'INV-440198',
    },
  },
  sideB: {
    id: 'AP-INV-440198',
    label: 'Vendor Invoice',
    amount: 127950,
    currency: 'USD',
    date: '2026-03-28',
    reference: 'INV-440198',
    fields: {
      source: 'AP',
      legalEntity: 'Arkhe EU Trading',
      counterparty: 'Glencore',
      docId: 'INV-440198',
    },
  },
  sideAAmount: 128500,
  sideBAmount: 127950,
  amountDelta: 550,
  amountDeltaPct: 0.428,
  sideADate: '2026-03-29',
  sideBDate: '2026-03-28',
  dateDeltaDays: 1,
  suggestedRootCause: 'Invoice captured without freight surcharge adjustment after final quantity true-up.',
  aiConfidence: 0.84,
  toleranceAmount: 250,
  comments: [
    {
      id: 'c1',
      comment: 'Freight uplift approved by logistics but missing in AP extract.',
      createdAt: new Date().toISOString(),
      user: { id: 'u1', name: 'Ana Rivera', email: 'ana@arkheos.io' },
    },
  ],
  history: [
    {
      id: 'h1',
      type: 'status_change',
      label: 'Assigned to controller',
      description: 'Routed for month-end certification.',
      createdAt: new Date().toISOString(),
      actor: 'System',
    },
  ],
};

const columns: DrillColumn<PreviewRow>[] = [
  { key: 'entity', header: 'Entity', accessor: (row) => row.entity, sortable: true },
  { key: 'breakCount', header: 'Breaks', accessor: (row) => row.breakCount, sortable: true, align: 'right', format: 'number', width: 120 },
  { key: 'exposure', header: 'Exposure', accessor: (row) => row.exposure, sortable: true, align: 'right', format: 'currency', width: 160 },
  { key: 'deltaPct', header: 'Delta %', accessor: (row) => row.deltaPct, sortable: true, align: 'right', format: 'percent', width: 130 },
  { key: 'status', header: 'Status', accessor: (row) => row.status, sortable: true, width: 140 },
];

export default function DrillPreview() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<DrillScope>(scope);

  const previewRows = useMemo(() => rows, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Drill UI Preview" description="Reusable cross-module drill-down primitives for forensic navigation." />

      <div className="space-y-3">
        <DrillBreadcrumb path={breadcrumbPath} onNavigate={() => undefined} />
        <ScopeHeader
          scope={activeScope}
          onRemove={(key) =>
            setActiveScope((current) => {
              const next = { ...current };
              delete next[key];
              return next;
            })
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>DrillDownTable</CardTitle>
            </div>
            <ExportScopeButton module="cashflows" level={4} scope={{ runId: 'RUN-2026-03', docId: 'INV-440198' }} estimatedRowCount={842} />
          </CardHeader>
          <CardContent>
            <DrillDownTable
              rows={previewRows}
              columns={columns}
              pageSize={8}
              onRowClick={() => setPanelOpen(true)}
              expandable={{ render: (row) => <div className="text-sm text-muted-foreground">Escalation note, audit references and exposure decomposition for {row.entity}.</div> }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DocumentTradeLineage</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTradeLineage docId="INV-440198" />
          </CardContent>
        </Card>
      </div>

      <BreakDetailPanel
        break={breakDetail}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onAddComment={async () => undefined}
        onMarkResolved={async () => undefined}
      />
    </div>
  );
}

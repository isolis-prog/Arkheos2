import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DrillProvider, useDrillContext } from '@/contexts/DrillContext';
import { DrillBreadcrumb, DrillDownTable, type DrillColumn, type DrillPathNode } from '@/components/drill';

interface MockRow {
  id: string;
  bucket: string;
  counterparty: string;
  amount: number;
  status: string;
}

const MOCK_ROWS: MockRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `row-${i + 1}`,
  bucket: ['OVERDUE', 'D7', 'D30', 'D60'][i % 4],
  counterparty: `Counterparty ${String.fromCharCode(65 + (i % 6))}`,
  amount: Math.round((Math.random() * 1_000_000 - 250_000) * 100) / 100,
  status: ['open', 'investigating', 'resolved'][i % 3],
}));

const COLUMNS: DrillColumn<MockRow>[] = [
  { key: 'bucket', header: 'Bucket', accessor: (r) => r.bucket },
  { key: 'counterparty', header: 'Counterparty', accessor: (r) => r.counterparty },
  { key: 'amount', header: 'Amount', accessor: (r) => r.amount, format: 'currency', align: 'right' },
  { key: 'status', header: 'Status', accessor: (r) => r.status },
];

const INITIAL_PATH: DrillPathNode[] = [
  { level: 0, label: 'Sandbox', scope: {}, href: '/dev/drill-sandbox' },
  { level: 1, label: 'L1 · Overview', scope: {}, href: '/dev/drill-sandbox?l=1' },
];

type Mode = 'data' | 'loading' | 'empty' | 'error';

function SandboxBody() {
  const { path, pushLevel, popToLevel } = useDrillContext();
  const [mode, setMode] = useState<Mode>('data');

  const rows = mode === 'data' ? MOCK_ROWS : [];
  const loading = mode === 'loading';
  const isError = mode === 'error';

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">DrillContext · Breadcrumb + Table sandbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['data', 'loading', 'empty', 'error'] as Mode[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? 'default' : 'outline'}
                onClick={() => setMode(m)}
              >
                {m}
              </Button>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                pushLevel({
                  level: path.length,
                  label: `L${path.length} · Drill ${path.length}`,
                  scope: { step: path.length },
                  href: `/dev/drill-sandbox?l=${path.length}`,
                })
              }
            >
              pushLevel
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={path.length <= 1}
              onClick={() => popToLevel(Math.max(0, path.length - 2))}
            >
              popToLevel
            </Button>
          </div>

          <div className="rounded-md border bg-card p-3">
            <DrillBreadcrumb path={path} onNavigate={(n) => popToLevel(n.level)} />
          </div>

          {isError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            >
              Mock error: failed to load drill data. Try a different mode.
            </div>
          ) : (
            <DrillDownTable
              rows={rows}
              columns={COLUMNS}
              loading={loading}
              emptyState={
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No rows for current scope (mock empty state).
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DrillUiSandboxPage() {
  return (
    <DrillProvider module="dev-sandbox" path={INITIAL_PATH}>
      <SandboxBody />
    </DrillProvider>
  );
}

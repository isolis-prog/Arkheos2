import { Download, FileWarning, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ConfirmationDocument } from '@/hooks/confirmations/types';
import { useConfirmationDocUrl } from '@/hooks/confirmations/useConfirmationDocUrl';

interface ConfirmationDocumentSideBySideProps {
  ourDoc: ConfirmationDocument | null;
  counterpartyDoc: ConfirmationDocument | null;
  highlightFields?: string[];
  awaitingSide?: 'us' | 'counterparty' | null;
}

export function ConfirmationDocumentSideBySide({
  ourDoc,
  counterpartyDoc,
  highlightFields = [],
  awaitingSide,
}: ConfirmationDocumentSideBySideProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DocumentColumn
        title="Our capture"
        doc={ourDoc}
        highlightFields={highlightFields}
        awaiting={awaitingSide === 'us'}
        side="us"
      />
      <DocumentColumn
        title="Counterparty confirmation"
        doc={counterpartyDoc}
        highlightFields={highlightFields}
        awaiting={awaitingSide === 'counterparty'}
        side="counterparty"
      />
    </div>
  );
}

interface DocumentColumnProps {
  title: string;
  doc: ConfirmationDocument | null;
  highlightFields: string[];
  awaiting: boolean;
  side: 'us' | 'counterparty';
}

function DocumentColumn({ title, doc, highlightFields, awaiting, side }: DocumentColumnProps) {
  const docUrlMutation = useConfirmationDocUrl();

  if (!doc && awaiting) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileWarning className="h-4 w-4 text-warning" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Awaiting {side === 'us' ? 'our trade capture' : 'counterparty confirmation'}.
          </p>
          <Skeleton className="h-32 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!doc) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No document available.</p>
        </CardContent>
      </Card>
    );
  }

  const attrs = doc.parsedAttributes ?? {};
  const entries = Object.entries(attrs);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.format?.toUpperCase()} · {doc.docType?.replace(/_/g, ' ')} ·{' '}
              {doc.receivedAt ? new Date(doc.receivedAt).toLocaleString() : '—'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => docUrlMutation.mutate(doc.confirmationDocId)}
            disabled={docUrlMutation.isPending}
          >
            {docUrlMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Source
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No parsed attributes.</p>
        )}
        {entries.map(([key, value]) => {
          const highlighted = highlightFields.includes(key);
          return (
            <div
              key={key}
              data-testid={`doc-${side}-field-${key}`}
              className={cn(
                'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-all',
                highlighted && 'ring-2 ring-destructive bg-destructive/5',
              )}
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{key}</span>
              <span className="font-mono text-foreground">{formatValue(value)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

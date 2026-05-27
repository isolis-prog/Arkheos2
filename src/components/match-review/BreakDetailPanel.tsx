import { XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import type { BreakDetail, MatchRecord } from '@/hooks/useMatchReviewData';

interface BreakDetailPanelProps {
  breakItem: BreakDetail;
  etrmRecord?: MatchRecord;
  netsuiteRecord?: MatchRecord;
}

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export function BreakDetailPanel({ breakItem, etrmRecord, netsuiteRecord }: BreakDetailPanelProps) {
  const hasMismatch = Boolean(etrmRecord && netsuiteRecord);
  const isMissingEtrm = !etrmRecord && Boolean(netsuiteRecord);
  const isMissingNetsuite = Boolean(etrmRecord) && !netsuiteRecord;

  return (
    <div className="bg-destructive/5 p-6 border-t border-destructive/20">
      {/* Break Analysis */}
      <div className="mb-6 p-4 bg-background rounded-lg border">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Break Analysis
        </h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium">{breakItem.breakType.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Severity:</span>
            <span className="ml-2 font-medium capitalize">{breakItem.severity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Amount at Risk:</span>
            <span className="ml-2 font-mono font-semibold text-destructive">
              {formatCurrency(breakItem.amountAtRisk)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge variant={getStatusVariant(breakItem.status)} className="ml-2">
              {breakItem.status.replace(/_/g, ' ')}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-2 gap-6">
        {/* ETRM Side */}
        <div className={`rounded-lg p-4 ${isMissingEtrm ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30'}`}>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            ETRM Record
            {isMissingEtrm && (
              <StatusBadge variant="error" className="ml-2">Missing</StatusBadge>
            )}
          </h4>
          {etrmRecord ? (
            <RecordDetails record={etrmRecord} highlightAmount={hasMismatch} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive/50" />
              <p>No matching ETRM record found</p>
            </div>
          )}
        </div>

        {/* NetSuite Side */}
        <div className={`rounded-lg p-4 ${isMissingNetsuite ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30'}`}>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-2" />
            NetSuite Record
            {isMissingNetsuite && (
              <StatusBadge variant="error" className="ml-2">Missing</StatusBadge>
            )}
          </h4>
          {netsuiteRecord ? (
            <RecordDetails record={netsuiteRecord} highlightAmount={hasMismatch} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive/50" />
              <p>No matching NetSuite record found</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3 justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/exceptions">View in Exceptions</Link>
        </Button>
        <Button variant="outline" size="sm">
          Create Amendment
        </Button>
        <Button size="sm">
          Investigate
        </Button>
      </div>
    </div>
  );
}

function RecordDetails({ record, highlightAmount }: { record: MatchRecord; highlightAmount?: boolean }) {
  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div>
        <dt className="text-muted-foreground">Deal ID</dt>
        <dd className="font-mono font-medium">{record.dealId}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className={`font-mono font-medium ${highlightAmount ? 'text-destructive' : ''}`}>
          {formatCurrency(record.amount, record.currency)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Strategy</dt>
        <dd className="font-medium">{record.strategy}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Fee Type</dt>
        <dd className="font-medium">{record.feeType}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Counterparty</dt>
        <dd className="font-medium">{record.counterparty}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Legal Entity</dt>
        <dd className="font-medium">{record.legalEntity}</dd>
      </div>
      {record.docId && (
        <div>
          <dt className="text-muted-foreground">Doc ID</dt>
          <dd className="font-mono font-medium">{record.docId}</dd>
        </div>
      )}
      {record.lineId && (
        <div>
          <dt className="text-muted-foreground">Line ID</dt>
          <dd className="font-mono font-medium">{record.lineId}</dd>
        </div>
      )}
    </dl>
  );
}

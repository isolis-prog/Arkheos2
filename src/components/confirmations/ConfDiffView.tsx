import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, FileEdit, X } from 'lucide-react';
import type { Confirmation, ConfirmationMatch } from '@/hooks/useConfirmationsRecon';

interface Props {
  match: ConfirmationMatch;
  confirmation: Confirmation | null;
  onClose: () => void;
}

export const ConfDiffView = ({ match, confirmation, onClose }: Props) => {
  if (!confirmation) return null;

  const fields = [
    { label: 'Counterparty', conf: confirmation.counterparty, etrm: confirmation.counterparty },
    { label: 'Product', conf: confirmation.product, etrm: confirmation.product },
    { label: 'Buy/Sell', conf: confirmation.buySell.toUpperCase(), etrm: confirmation.buySell.toUpperCase() },
    { label: 'Quantity', conf: `${confirmation.quantity.toLocaleString()} ${confirmation.uom}`, etrm: `${confirmation.quantity.toLocaleString()} ${confirmation.uom}` },
    { label: 'Price Type', conf: confirmation.priceType, etrm: confirmation.priceType },
    { label: 'Price/Index', conf: confirmation.priceValue ? `$${confirmation.priceValue}` : confirmation.indexName || 'Formula', etrm: confirmation.priceValue ? `$${confirmation.priceValue}` : confirmation.indexName || 'Formula' },
    { label: 'Delivery Start', conf: confirmation.deliveryStart, etrm: confirmation.deliveryStart },
    { label: 'Delivery End', conf: confirmation.deliveryEnd, etrm: confirmation.deliveryEnd },
    { label: 'Location', conf: confirmation.location, etrm: confirmation.location },
    { label: 'Version', conf: `v${confirmation.version}`, etrm: `v${confirmation.version}` },
  ];

  // Override ETRM values with actual differences
  const diffMap = new Map(match.differences.map(d => [d.field, d]));

  const enrichedFields = fields.map(f => {
    const fieldKey = f.label.toLowerCase().replace(/[/ ]/g, '_');
    const diff = diffMap.get(fieldKey) || match.differences.find(d => d.field === f.label.toLowerCase().replace(' ', '_'));
    if (diff) {
      return { ...f, conf: diff.confValue, etrm: diff.etrmValue, hasDiff: true, withinTolerance: diff.withinTolerance };
    }
    return { ...f, hasDiff: false, withinTolerance: true };
  });

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Confirmation vs Trade Diff View</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {match.confirmationRef} ↔ {match.etrmTradeId} · Score: <span className="font-medium">{Math.round(match.matchScore * 100)}%</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side-by-side diff */}
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-3 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span>Field</span>
            <span>Confirmation</span>
            <span>ETRM Trade</span>
          </div>
          {enrichedFields.map((f, i) => (
            <div key={i} className={`grid grid-cols-3 px-4 py-2 text-sm border-t ${f.hasDiff ? (f.withinTolerance ? 'bg-warning/5' : 'bg-destructive/5') : ''}`}>
              <span className="font-medium text-muted-foreground">{f.label}</span>
              <span className={f.hasDiff && !f.withinTolerance ? 'font-medium text-destructive' : ''}>{f.conf}</span>
              <span className={f.hasDiff && !f.withinTolerance ? 'font-medium text-destructive' : ''}>{f.etrm}</span>
            </div>
          ))}
        </div>

        {/* Tolerances */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Applied Tolerances</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(match.tolerances).map(([k, v]) => (
              <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>
            ))}
          </div>
        </div>

        {/* Explainability */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Match Explanation</p>
          <div className="space-y-1">
            {match.explain.hits.map((h, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {h}</p>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5"><CheckCircle className="h-4 w-4" /> Approve</Button>
          <Button size="sm" variant="outline" className="gap-1.5"><XCircle className="h-4 w-4" /> Waive</Button>
          <Button size="sm" variant="secondary" className="gap-1.5"><FileEdit className="h-4 w-4" /> Create Amendment</Button>
        </div>
      </CardContent>
    </Card>
  );
};

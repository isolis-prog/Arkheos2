import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TaxRule } from '@/hooks/useTaxControls';

interface Props {
  rules: TaxRule[];
}

export const TaxRulesTable = ({ rules }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Rule Name</TableHead>
          <TableHead>Jurisdiction</TableHead>
          <TableHead>Tax Type</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Incoterm</TableHead>
          <TableHead className="text-right">Rate %</TableHead>
          <TableHead>Exemption</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Effective</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.ruleName}</TableCell>
            <TableCell><Badge variant="outline" className="text-xs">{r.jurisdiction}</Badge></TableCell>
            <TableCell>{r.taxType.replace('_', ' ').toUpperCase()}</TableCell>
            <TableCell className="text-sm">{r.productGroup || 'All'}</TableCell>
            <TableCell className="text-sm">{r.incoterm || 'Any'}</TableCell>
            <TableCell className="text-right font-mono">{r.ratePct}%</TableCell>
            <TableCell className="text-sm">{r.exemptionCode ? <Badge variant="secondary" className="text-xs">{r.exemptionCode}</Badge> : '—'}</TableCell>
            <TableCell className="font-mono text-sm">v{r.version}</TableCell>
            <TableCell className="text-sm">{r.effectiveFrom}{r.effectiveTo ? ` → ${r.effectiveTo}` : ' →'}</TableCell>
            <TableCell>
              <Badge variant={r.isActive ? 'secondary' : 'outline'} className={r.isActive ? 'bg-green-500/15 text-green-700 border-green-300' : ''}>
                {r.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

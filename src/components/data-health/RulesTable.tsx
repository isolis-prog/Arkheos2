import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { DQRule } from '@/hooks/useDataHealth';

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const sourceLabels: Record<string, string> = { etrm: 'ETRM', erp: 'ERP', ops: 'Ops', market_data: 'Market Data' };

export const RulesTable = ({ rules }: { rules: DQRule[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rule</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Check Type</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead className="text-center">Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.ruleName}</TableCell>
            <TableCell className="capitalize">{r.entityType}</TableCell>
            <TableCell><Badge variant="outline">{sourceLabels[r.sourceSystem] || r.sourceSystem}</Badge></TableCell>
            <TableCell className="capitalize">{r.checkType}</TableCell>
            <TableCell className="font-mono text-xs">{r.fieldName}</TableCell>
            <TableCell><Badge variant={severityVariant[r.severity]}>{r.severity}</Badge></TableCell>
            <TableCell className="text-center"><Switch checked={r.isActive} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

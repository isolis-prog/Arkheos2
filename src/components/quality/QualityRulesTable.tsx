import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QualityRule } from '@/hooks/useQuality';

interface Props {
  rules: QualityRule[];
}

const typeColors: Record<string, string> = {
  penalty: 'bg-red-500/10 text-red-700 border-red-300',
  bonus: 'bg-green-500/10 text-green-700 border-green-300',
  rejection: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const QualityRulesTable = ({ rules }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commodity</TableHead>
          <TableHead>Attribute</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Threshold</TableHead>
          <TableHead>Formula</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.commodity}</TableCell>
            <TableCell>{r.attrKey}</TableCell>
            <TableCell><Badge variant="outline" className={typeColors[r.ruleType]}>{r.ruleType}</Badge></TableCell>
            <TableCell className="font-mono text-sm">
              {r.thresholdMin != null && `≥${r.thresholdMin}`}
              {r.thresholdMin != null && r.thresholdMax != null && ' / '}
              {r.thresholdMax != null && `≤${r.thresholdMax}`}
            </TableCell>
            <TableCell className="font-mono text-xs max-w-[300px] truncate">{r.formula}</TableCell>
            <TableCell><Badge variant="secondary">v{r.version}</Badge></TableCell>
            <TableCell>{r.isActive ? <Badge className="bg-green-500/10 text-green-700 border-green-300" variant="outline">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

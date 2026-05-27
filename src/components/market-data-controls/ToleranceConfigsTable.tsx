import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ToleranceConfig } from '@/hooks/useMarketDataControls';

interface Props { configs: ToleranceConfig[]; }

export const ToleranceConfigsTable = ({ configs }: Props) => (
  <Card>
    <CardHeader><CardTitle>Tolerance Configuration by Index</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tolerance</TableHead>
            <TableHead>Spike Z-Threshold</TableHead>
            <TableHead>Stale (hours)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.indexName}</TableCell>
              <TableCell className="capitalize">{c.toleranceType}</TableCell>
              <TableCell>{c.toleranceValue}</TableCell>
              <TableCell>{c.spikeZThreshold}</TableCell>
              <TableCell>{c.staleHours}h</TableCell>
              <TableCell><StatusBadge variant={c.isActive ? 'success' : 'muted'}>{c.isActive ? 'Active' : 'Inactive'}</StatusBadge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

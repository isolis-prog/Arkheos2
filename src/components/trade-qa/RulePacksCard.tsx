import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { QARulePack } from '@/hooks/useTradeQA';

interface Props { rulePacks: QARulePack[]; }

export const RulePacksCard = ({ rulePacks }: Props) => (
  <Card>
    <CardHeader><CardTitle>Rule Packs</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Trade Type</TableHead>
            <TableHead>Rules</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Pass Rate</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rulePacks.map(rp => (
            <TableRow key={rp.id}>
              <TableCell className="font-medium">{rp.name}</TableCell>
              <TableCell className="capitalize">{rp.tradeType}</TableCell>
              <TableCell>{rp.rulesCount}</TableCell>
              <TableCell>v{rp.version}</TableCell>
              <TableCell>
                <StatusBadge variant={rp.passRate >= 90 ? 'success' : rp.passRate >= 80 ? 'warning' : 'error'}>
                  {rp.passRate}%
                </StatusBadge>
              </TableCell>
              <TableCell>{rp.lastRun ? format(new Date(rp.lastRun), 'MMM dd HH:mm') : '—'}</TableCell>
              <TableCell><StatusBadge variant={rp.isActive ? 'success' : 'muted'}>{rp.isActive ? 'Active' : 'Inactive'}</StatusBadge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Nomination } from '@/hooks/useLogistics';

const statusVariant: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
  expired: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

interface Props {
  nominations: Nomination[];
  filter: string;
  setFilter: (v: string) => void;
}

export const NominationsTable = ({ nominations, filter, setFilter }: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-lg">Nominations</CardTitle>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Ref</TableHead>
            <TableHead className="font-semibold">Pipeline / Market</TableHead>
            <TableHead className="font-semibold">Product</TableHead>
            <TableHead className="font-semibold text-right">Quantity</TableHead>
            <TableHead className="font-semibold">Counterparty</TableHead>
            <TableHead className="font-semibold">Flow Date</TableHead>
            <TableHead className="font-semibold">Cycle</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nominations.map(n => (
            <TableRow key={n.id} className="data-table-row">
              <TableCell className="font-mono text-sm">{n.nomination_ref}</TableCell>
              <TableCell>{n.pipeline || n.market || '—'}</TableCell>
              <TableCell>{n.product}</TableCell>
              <TableCell className="text-right font-mono">{n.quantity.toLocaleString()} {n.uom}</TableCell>
              <TableCell>{n.counterparty || '—'}</TableCell>
              <TableCell className="text-sm">{n.flow_date}</TableCell>
              <TableCell className="text-sm">{n.cycle || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusVariant[n.status]}>
                  {n.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Ship, Truck, Train, ArrowRightLeft, Pipette, Search } from 'lucide-react';
import type { Movement } from '@/hooks/useLogistics';

const typeIcons: Record<string, React.ReactNode> = {
  vessel: <Ship className="h-4 w-4" />,
  truck: <Truck className="h-4 w-4" />,
  rail: <Train className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  pipeline: <Pipette className="h-4 w-4" />,
  shipment: <Ship className="h-4 w-4" />,
};

const statusVariant: Record<string, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  in_transit: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  delivered: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

interface Props {
  movements: Movement[];
  filter: string;
  setFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const MovementsTable = ({ movements, filter, setFilter, searchQuery, setSearchQuery }: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-lg">Movements</CardTitle>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movements…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 w-56"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Ref</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Product</TableHead>
            <TableHead className="font-semibold text-right">Quantity</TableHead>
            <TableHead className="font-semibold">Route</TableHead>
            <TableHead className="font-semibold">Counterparty</TableHead>
            <TableHead className="font-semibold">Sched. Date</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map(m => (
            <TableRow key={m.id} className="data-table-row">
              <TableCell className="font-mono text-sm">{m.movement_ref}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {typeIcons[m.movement_type]}
                  <span className="capitalize text-sm">{m.movement_type}</span>
                </div>
              </TableCell>
              <TableCell>{m.product}</TableCell>
              <TableCell className="text-right font-mono">{m.quantity.toLocaleString()} {m.uom}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{m.origin_location} → {m.destination_location}</TableCell>
              <TableCell>{m.counterparty}</TableCell>
              <TableCell className="text-sm">{m.scheduled_date}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusVariant[m.status]}>
                  {m.status.replace('_', ' ')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

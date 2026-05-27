import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Ship, Anchor } from 'lucide-react';
import { Voyage } from '@/hooks/useShippingChartering';

const statusColors: Record<string, string> = {
  FIXING: 'bg-muted text-muted-foreground',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  LOADING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ON_PASSAGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  DISCHARGING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

interface Props {
  voyages: Voyage[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const VoyageManagerTab = ({ voyages, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search vessels, cargo, ports…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {['FIXING', 'CONFIRMED', 'LOADING', 'ON_PASSAGE', 'DISCHARGING', 'COMPLETED'].map(s => (
            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Ship className="h-4 w-4" /> Active Voyages ({voyages.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Vessel</TableHead>
              <TableHead>Charter</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Load Port</TableHead>
              <TableHead>Discharge Port</TableHead>
              <TableHead>Laycan</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voyages.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.vessel_name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{v.charter_type === 'time_charter' ? 'TC' : 'VC'}</Badge></TableCell>
                <TableCell>{v.cargo}</TableCell>
                <TableCell>{v.load_port}</TableCell>
                <TableCell>{v.discharge_port}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">{v.laycan_start} → {v.laycan_end}</TableCell>
                <TableCell className="font-mono text-sm">{v.freight_rate.toLocaleString()} {v.freight_unit}</TableCell>
                <TableCell><Badge className={statusColors[v.status] || ''}>{v.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{v.trade_id || '—'}</TableCell>
              </TableRow>
            ))}
            {voyages.length === 0 && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No voyages match filters</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

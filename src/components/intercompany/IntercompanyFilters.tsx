import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  pairTypeFilter: string;
  setPairTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const IntercompanyFilters = ({
  pairTypeFilter, setPairTypeFilter,
  statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
}: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search ref or entity…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={pairTypeFilter} onValueChange={setPairTypeFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="invoice">Invoice</SelectItem>
        <SelectItem value="cash">Cash</SelectItem>
        <SelectItem value="trade_mirror">Trade Mirror</SelectItem>
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="matched">Matched</SelectItem>
        <SelectItem value="partial">Partial</SelectItem>
        <SelectItem value="break">Break</SelectItem>
        <SelectItem value="unmatched">Unmatched</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

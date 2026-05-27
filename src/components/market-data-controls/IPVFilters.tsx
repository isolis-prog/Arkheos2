import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  indexFilter: string; setIndexFilter: (v: string) => void;
  dateFilter: string; setDateFilter: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  searchQuery: string; setSearchQuery: (v: string) => void;
  indices: string[]; dates: string[];
}

export const IPVFilters = (props: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search index…" value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={props.indexFilter} onValueChange={props.setIndexFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Index" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Indices</SelectItem>
        {props.indices.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={props.dateFilter} onValueChange={props.setDateFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Date" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Dates</SelectItem>
        {props.dates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="breach">Breaches</SelectItem>
        <SelectItem value="stale">Stale</SelectItem>
        <SelectItem value="spike">Spikes</SelectItem>
        <SelectItem value="overridden">Overridden</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

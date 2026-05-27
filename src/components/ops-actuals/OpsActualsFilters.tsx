import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  locationFilter: string;
  setLocationFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  locations: string[];
}

export const OpsActualsFilters = (props: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search trade ref or counterparty…" value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={props.locationFilter} onValueChange={props.setLocationFilter}>
      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Location" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Locations</SelectItem>
        {props.locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="ok">OK</SelectItem>
        <SelectItem value="warning">Warning</SelectItem>
        <SelectItem value="breach">Breach</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

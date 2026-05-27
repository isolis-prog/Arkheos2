import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  isoFilter: string;
  setIsoFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

const ISOS = ['PJM', 'ERCOT', 'CAISO', 'MISO', 'NYISO', 'SPP', 'ISO-NE'];

export const ISOFilters = ({ isoFilter, setIsoFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search statement ref…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={isoFilter} onValueChange={setIsoFilter}>
      <SelectTrigger className="w-[130px]"><SelectValue placeholder="ISO" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All ISOs</SelectItem>
        {ISOS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        {['uploaded', 'parsing', 'parsed', 'reconciling', 'reconciled', 'error'].map(s => (
          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  costTypeFilter: string;
  setCostTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const LogCostFilters = ({ costTypeFilter, setCostTypeFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search delivery or counterparty…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Cost Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {['freight', 'demurrage', 'storage', 'terminal', 'inspection', 'insurance'].map(t => (
          <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        {['pending', 'matched', 'variance', 'disputed', 'resolved'].map(s => (
          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  commodityFilter: string;
  setCommodityFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const QualityFilters = ({ commodityFilter, setCommodityFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search delivery or counterparty…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={commodityFilter} onValueChange={setCommodityFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Commodities</SelectItem>
        {['Crude Oil', 'Gasoline', 'Diesel', 'Jet Fuel', 'LNG', 'Coal', 'Copper'].map(c => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="evaluated">Evaluated</SelectItem>
        <SelectItem value="disputed">Disputed</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

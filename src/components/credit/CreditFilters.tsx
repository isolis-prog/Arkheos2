import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  trafficFilter: string;
  setTrafficFilter: (v: string) => void;
}

export const CreditFilters = ({ searchQuery, setSearchQuery, trafficFilter, setTrafficFilter }: Props) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search counterparty…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>
    <Select value={trafficFilter} onValueChange={setTrafficFilter}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Traffic Light" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="red">🔴 Red</SelectItem>
        <SelectItem value="amber">🟡 Amber</SelectItem>
        <SelectItem value="green">🟢 Green</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

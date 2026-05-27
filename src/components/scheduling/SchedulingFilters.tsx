import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { SchedulingFilters as Filters } from '@/hooks/useScheduling';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  commodities: string[];
  locations: string[];
  counterparties: string[];
  books: string[];
}

export const SchedulingFilters = ({ filters, onFiltersChange, commodities, locations, counterparties, books }: Props) => {
  const update = (key: keyof Filters, value: string) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deal, counterparty, location..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filters.commodity} onValueChange={(v) => update('commodity', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Commodities</SelectItem>
          {commodities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.location} onValueChange={(v) => update('location', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.counterparty} onValueChange={(v) => update('counterparty', v)}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Counterparty" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Counterparties</SelectItem>
          {counterparties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.book} onValueChange={(v) => update('book', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Book" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Books</SelectItem>
          {books.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.reconStatus} onValueChange={(v) => update('reconStatus', v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Recon Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="matched">Matched</SelectItem>
          <SelectItem value="break">Break</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

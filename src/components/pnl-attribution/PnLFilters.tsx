import { Calendar } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PnLFilters as Filters } from '@/hooks/usePnLAttribution';

interface PnLFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filterOptions: {
    books: string[];
    counterparties: string[];
    portfolios: string[];
  };
}

export const PnLFilters = ({ filters, onFiltersChange, filterOptions }: PnLFiltersProps) => {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Comparing snapshots</span>
      </div>

      <Select value={filters.portfolio} onValueChange={(v) => updateFilter('portfolio', v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Portfolio" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Portfolios</SelectItem>
          {filterOptions.portfolios.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.book} onValueChange={(v) => updateFilter('book', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Book" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Books</SelectItem>
          {filterOptions.books.map((book) => (
            <SelectItem key={book} value={book}>{book}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.counterparty} onValueChange={(v) => updateFilter('counterparty', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Counterparty" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Counterparties</SelectItem>
          {filterOptions.counterparties.map((cp) => (
            <SelectItem key={cp} value={cp}>{cp}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.source} onValueChange={(v) => updateFilter('source', v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="front_office">Front Office</SelectItem>
          <SelectItem value="middle_office">Middle Office</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataExplorerFilters as FilterState } from '@/hooks/useDataExplorer';

interface FilterOptions {
  sourceSystems: string[];
  recordTypes: string[];
  feeTypes: string[];
  strategies: string[];
  counterparties: string[];
  legalEntities: string[];
}

interface DataExplorerFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filterOptions: FilterOptions;
}

export const DataExplorerFilters = ({
  filters,
  onFiltersChange,
  filterOptions,
}: DataExplorerFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      sourceSystem: 'all',
      recordType: 'all',
      feeType: 'all',
      strategy: 'all',
      counterparty: 'all',
      legalEntity: 'all',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.sourceSystem !== 'all' ||
    filters.recordType !== 'all' ||
    filters.feeType !== 'all' ||
    filters.strategy !== 'all' ||
    filters.counterparty !== 'all' ||
    filters.legalEntity !== 'all' ||
    filters.search !== '';

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Deal ID, Match Key, Doc ID, Counterparty..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.sourceSystem} onValueChange={(v) => updateFilter('sourceSystem', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source System" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {filterOptions.sourceSystems.map((source) => (
              <SelectItem key={source} value={source}>
                {source.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.recordType} onValueChange={(v) => updateFilter('recordType', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Record Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {filterOptions.recordTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.feeType} onValueChange={(v) => updateFilter('feeType', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Fee Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fees</SelectItem>
            {filterOptions.feeTypes.map((fee) => (
              <SelectItem key={fee} value={fee}>
                {fee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.strategy} onValueChange={(v) => updateFilter('strategy', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            {filterOptions.strategies.map((strategy) => (
              <SelectItem key={strategy} value={strategy}>
                {strategy}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.counterparty} onValueChange={(v) => updateFilter('counterparty', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Counterparty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counterparties</SelectItem>
            {filterOptions.counterparties.map((cp) => (
              <SelectItem key={cp} value={cp}>
                {cp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.legalEntity} onValueChange={(v) => updateFilter('legalEntity', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Legal Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {filterOptions.legalEntities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

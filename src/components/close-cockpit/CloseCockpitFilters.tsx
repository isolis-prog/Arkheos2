import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloseCockpitFilters as FiltersState, ClosePeriod } from '@/hooks/useCloseCockpit';

interface Props {
  filters: FiltersState;
  onFiltersChange: (f: FiltersState) => void;
  legalEntities: string[];
  categories: string[];
  periods: ClosePeriod[];
}

export const CloseCockpitFilters = ({ filters, onFiltersChange, legalEntities, categories, periods }: Props) => {
  const update = (key: keyof FiltersState, value: string) =>
    onFiltersChange({ ...filters, [key]: value === 'all' ? '' : value });

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filters.periodId || 'all'} onValueChange={(v) => update('periodId', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Period" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Periods</SelectItem>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.periodName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.legalEntity || 'all'} onValueChange={(v) => update('legalEntity', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Entity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entities</SelectItem>
          {legalEntities.map((e) => (
            <SelectItem key={e} value={e}>{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.category || 'all'} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status || 'all'} onValueChange={(v) => update('status', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

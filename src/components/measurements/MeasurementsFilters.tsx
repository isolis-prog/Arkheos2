import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { MeasurementsFilters as Filters } from '@/hooks/useMeasurements';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  locations: string[];
  meterIds: string[];
  commodities: string[];
}

export const MeasurementsFilters = ({ filters, onFiltersChange, locations, meterIds, commodities }: Props) => {
  const update = (key: keyof Filters, value: string) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search location, meter, commodity..." value={filters.search} onChange={(e) => update('search', e.target.value)} className="pl-9" />
      </div>
      <Select value={filters.location} onValueChange={(v) => update('location', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.meterId} onValueChange={(v) => update('meterId', v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Meter" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Meters</SelectItem>
          {meterIds.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.commodity} onValueChange={(v) => update('commodity', v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Commodities</SelectItem>
          {commodities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(v) => update('status', v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="matched">Matched</SelectItem>
          <SelectItem value="adjusted">Adjusted</SelectItem>
          <SelectItem value="disputed">Disputed</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

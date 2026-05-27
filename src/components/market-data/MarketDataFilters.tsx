import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { MarketDataFilters as Filters } from '@/hooks/useMarketData';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
}

export const MarketDataFilters = ({ filters, onFiltersChange }: Props) => {
  const set = (key: keyof Filters, value: string) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search curves…" value={filters.search} onChange={(e) => set('search', e.target.value)} className="pl-9" />
      </div>
      <Select value={filters.commodity} onValueChange={(v) => set('commodity', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Commodity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Commodities</SelectItem>
          <SelectItem value="Crude Oil">Crude Oil</SelectItem>
          <SelectItem value="Natural Gas">Natural Gas</SelectItem>
          <SelectItem value="Products">Products</SelectItem>
          <SelectItem value="FX">FX</SelectItem>
          <SelectItem value="Metals">Metals</SelectItem>
          <SelectItem value="Coal">Coal</SelectItem>
          <SelectItem value="Power">Power</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.source} onValueChange={(v) => set('source', v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="vendor_feed">Vendor Feed</SelectItem>
          <SelectItem value="exchange">Exchange</SelectItem>
          <SelectItem value="etrm_extract">ETRM Extract</SelectItem>
          <SelectItem value="broker_quote">Broker Quote</SelectItem>
          <SelectItem value="manual_lock">Manual Lock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

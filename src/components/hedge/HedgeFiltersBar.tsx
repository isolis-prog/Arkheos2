import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { HedgeFilters as HedgeFiltersType } from '@/hooks/useHedgeAccounting';

interface Props {
  filters: HedgeFiltersType;
  onFiltersChange: (f: HedgeFiltersType) => void;
}

export const HedgeFilters = ({ filters, onFiltersChange }: Props) => {
  const set = (key: keyof HedgeFiltersType, value: string) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search relationships…" value={filters.search} onChange={(e) => set('search', e.target.value)} className="pl-9" />
      </div>
      <Select value={filters.method} onValueChange={(v) => set('method', v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Method" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="cash_flow">Cash Flow</SelectItem>
          <SelectItem value="fair_value">Fair Value</SelectItem>
          <SelectItem value="net_investment">Net Investment</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(v) => set('status', v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="designated">Designated</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="de_designated">De-designated</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="matured">Matured</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.standard} onValueChange={(v) => set('standard', v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Standard" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Standards</SelectItem>
          <SelectItem value="IFRS9">IFRS 9</SelectItem>
          <SelectItem value="USGAAP">US GAAP</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

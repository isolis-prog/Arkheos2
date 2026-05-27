import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ConfirmationsFilters as Filters, ConfirmationStatus } from '@/hooks/useConfirmationsRecon';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  commodityGroups: string[];
  counterparties: string[];
}

export const ConfirmationsFilters = ({ filters, onChange, commodityGroups, counterparties }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search confirmation ID, counterparty, product…" className="pl-9" value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} />
    </div>
    <Select value={filters.status} onValueChange={v => onChange({ ...filters, status: v as ConfirmationStatus | 'all' })}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="matched">Matched</SelectItem>
        <SelectItem value="partial">Partial</SelectItem>
        <SelectItem value="unmatched">Unmatched</SelectItem>
        <SelectItem value="disputed">Disputed</SelectItem>
        <SelectItem value="waived">Waived</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filters.commodityGroup || 'all'} onValueChange={v => onChange({ ...filters, commodityGroup: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Commodities</SelectItem>
        {commodityGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.counterparty || 'all'} onValueChange={v => onChange({ ...filters, counterparty: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Counterparty" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Counterparties</SelectItem>
        {counterparties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.buySell || 'all'} onValueChange={v => onChange({ ...filters, buySell: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[120px]"><SelectValue placeholder="Buy/Sell" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="buy">Buy</SelectItem>
        <SelectItem value="sell">Sell</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

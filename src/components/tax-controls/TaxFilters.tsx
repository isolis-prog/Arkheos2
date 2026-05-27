import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  jurisdictionFilter: string;
  setJurisdictionFilter: (v: string) => void;
  taxTypeFilter: string;
  setTaxTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  jurisdictions: string[];
  taxTypes: string[];
}

export const TaxFilters = ({
  jurisdictionFilter, setJurisdictionFilter,
  taxTypeFilter, setTaxTypeFilter,
  statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
  jurisdictions, taxTypes,
}: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search deal ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Jurisdiction" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Jurisdictions</SelectItem>
        {jurisdictions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={taxTypeFilter} onValueChange={setTaxTypeFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tax Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {taxTypes.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="matched">Matched</SelectItem>
        <SelectItem value="delta">Delta</SelectItem>
        <SelectItem value="missing">Missing</SelectItem>
        <SelectItem value="exception">Exception</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

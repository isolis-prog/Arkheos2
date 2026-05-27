import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  entityFilter: string;
  setEntityFilter: (v: string) => void;
  accountFilter: string;
  setAccountFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  entities: string[];
  accounts: string[];
}

export const DealToGLFilters = ({
  entityFilter, setEntityFilter,
  accountFilter, setAccountFilter,
  statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
  entities, accounts,
}: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search deal ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={entityFilter} onValueChange={setEntityFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Entities</SelectItem>
        {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={accountFilter} onValueChange={setAccountFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Account" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Accounts</SelectItem>
        {accounts.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="matched">Matched</SelectItem>
        <SelectItem value="partial">Partial</SelectItem>
        <SelectItem value="missing">Missing</SelectItem>
        <SelectItem value="exception">Exception</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

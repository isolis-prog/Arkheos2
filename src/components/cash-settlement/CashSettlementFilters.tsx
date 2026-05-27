import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  statusFilter: string; setStatusFilter: (v: string) => void;
  exceptionFilter: string; setExceptionFilter: (v: string) => void;
  searchQuery: string; setSearchQuery: (v: string) => void;
}

export const CashSettlementFilters = (props: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search invoice, counterparty, bank ref…" value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="proposed">Proposed</SelectItem>
        <SelectItem value="accepted">Accepted</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
        <SelectItem value="split">Split</SelectItem>
      </SelectContent>
    </Select>
    <Select value={props.exceptionFilter} onValueChange={props.setExceptionFilter}>
      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Exceptions" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="exceptions">Exceptions Only</SelectItem>
        <SelectItem value="unapplied_cash">Unapplied Cash</SelectItem>
        <SelectItem value="short_pay">Short Pay</SelectItem>
        <SelectItem value="duplicate_pay">Duplicate Pay</SelectItem>
        <SelectItem value="fx_mismatch">FX Mismatch</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

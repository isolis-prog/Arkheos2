import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Props {
  counterparties: string[];
  counterpartyFilter: string;
  setCounterpartyFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
}

export const MarginFilters = ({ counterparties, counterpartyFilter, setCounterpartyFilter, statusFilter, setStatusFilter, dateFilter, setDateFilter }: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Counterparty" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Counterparties</SelectItem>
        {counterparties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="received">Received</SelectItem>
        <SelectItem value="validated">Validated</SelectItem>
        <SelectItem value="reconciled">Reconciled</SelectItem>
        <SelectItem value="disputed">Disputed</SelectItem>
        <SelectItem value="settled">Settled</SelectItem>
      </SelectContent>
    </Select>
    <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[160px]" />
  </div>
);

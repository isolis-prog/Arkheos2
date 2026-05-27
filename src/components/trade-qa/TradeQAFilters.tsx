import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  tradeTypeFilter: string;
  setTradeTypeFilter: (v: string) => void;
  resultFilter: string;
  setResultFilter: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const TradeQAFilters = (props: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search trade ref or counterparty…" value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={props.tradeTypeFilter} onValueChange={props.setTradeTypeFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Trade Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="physical">Physical</SelectItem>
        <SelectItem value="swap">Swap</SelectItem>
        <SelectItem value="option">Option</SelectItem>
        <SelectItem value="future">Future</SelectItem>
      </SelectContent>
    </Select>
    <Select value={props.resultFilter} onValueChange={props.setResultFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Result" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Results</SelectItem>
        <SelectItem value="pass">Pass</SelectItem>
        <SelectItem value="fail">Fail</SelectItem>
        <SelectItem value="warning">Warning</SelectItem>
      </SelectContent>
    </Select>
    <Select value={props.severityFilter} onValueChange={props.setSeverityFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Severities</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

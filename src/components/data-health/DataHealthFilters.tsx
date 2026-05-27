import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sourceFilter: string;
  setSourceFilter: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
}

export const DataHealthFilters = ({ searchTerm, setSearchTerm, sourceFilter, setSourceFilter, severityFilter, setSeverityFilter }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search issues..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
    </div>
    <Select value={sourceFilter} onValueChange={setSourceFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sources</SelectItem>
        <SelectItem value="etrm">ETRM</SelectItem>
        <SelectItem value="erp">ERP</SelectItem>
        <SelectItem value="ops">Ops</SelectItem>
        <SelectItem value="market_data">Market Data</SelectItem>
      </SelectContent>
    </Select>
    <Select value={severityFilter} onValueChange={setSeverityFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Severity</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

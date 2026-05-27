import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}

export const IntStudioFilters = ({ searchTerm, setSearchTerm, typeFilter, setTypeFilter, statusFilter, setStatusFilter }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search connectors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
    </div>
    <Select value={typeFilter} onValueChange={setTypeFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="etrm">ETRM</SelectItem>
        <SelectItem value="erp">ERP</SelectItem>
        <SelectItem value="bank">Bank</SelectItem>
        <SelectItem value="market_data">Market Data</SelectItem>
        <SelectItem value="iso">ISO</SelectItem>
        <SelectItem value="ops">Operations</SelectItem>
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Job Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="running">Running</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
        <SelectItem value="retrying">Retrying</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  docTypeFilter: string;
  setDocTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}

export const DocIntelFilters = ({ searchTerm, setSearchTerm, docTypeFilter, setDocTypeFilter, statusFilter, setStatusFilter }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
    </div>
    <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Doc Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="isda">ISDA</SelectItem>
        <SelectItem value="confirmation">Confirmation</SelectItem>
        <SelectItem value="msa">MSA</SelectItem>
        <SelectItem value="charter_party">Charter Party</SelectItem>
        <SelectItem value="terminal_agreement">Terminal Agreement</SelectItem>
        <SelectItem value="iso_statement">ISO Statement</SelectItem>
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="processing">Processing</SelectItem>
        <SelectItem value="extracted">Extracted</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

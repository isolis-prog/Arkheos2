import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const MDMFilters = (props: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search entity or issue…" value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="pl-9" />
    </div>
    <Select value={props.categoryFilter} onValueChange={props.setCategoryFilter}>
      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="gl_mapping">GL Mapping</SelectItem>
        <SelectItem value="tax_code">Tax Code</SelectItem>
        <SelectItem value="payment_terms">Payment Terms</SelectItem>
        <SelectItem value="location_alias">Location Alias</SelectItem>
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
    <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="open">Open</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="resolved">Resolved</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

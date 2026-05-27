import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import type { ExceptionCaseFilters as Filters, ExceptionCaseStatus, ExceptionOwnerRole } from '@/hooks/useExceptionCases';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  modules: string[];
}

export const ExceptionInboxFilters = ({ filters, onChange, modules }: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search case ref or description…" className="pl-9" value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} />
    </div>
    <Select value={filters.module || 'all'} onValueChange={v => onChange({ ...filters, module: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Module" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Modules</SelectItem>
        {modules.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace('-', ' ')}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.severity || 'all'} onValueChange={v => onChange({ ...filters, severity: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[130px]"><SelectValue placeholder="Severity" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filters.status} onValueChange={v => onChange({ ...filters, status: v as ExceptionCaseStatus | 'all' })}>
      <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="new">New</SelectItem>
        <SelectItem value="triaged">Triaged</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="pending_counterparty">Pending Cpty</SelectItem>
        <SelectItem value="resolved">Resolved</SelectItem>
        <SelectItem value="waived">Waived</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filters.ownerRole} onValueChange={v => onChange({ ...filters, ownerRole: v as ExceptionOwnerRole | 'all' })}>
      <SelectTrigger className="w-[130px]"><SelectValue placeholder="Owner" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Roles</SelectItem>
        <SelectItem value="fo">FO</SelectItem>
        <SelectItem value="mo">MO</SelectItem>
        <SelectItem value="bo">BO</SelectItem>
        <SelectItem value="ops">Ops</SelectItem>
        <SelectItem value="treasury">Treasury</SelectItem>
      </SelectContent>
    </Select>
    <div className="flex items-center gap-2">
      <Switch id="sla-overdue" checked={filters.slaOverdue} onCheckedChange={v => onChange({ ...filters, slaOverdue: v })} />
      <Label htmlFor="sla-overdue" className="text-sm">SLA Overdue</Label>
    </div>
  </div>
);

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { MappingFilters as Filters, CanonicalEntityType, MatchResult } from '@/hooks/useCoreMappings';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  entityTypes: CanonicalEntityType[];
  sourceSystems: string[];
}

export const MappingFilters = ({ filters, onChange, entityTypes, sourceSystems }: Props) => (
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search source ID or canonical name…" className="pl-9" value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} />
    </div>
    <Select value={filters.entityType} onValueChange={v => onChange({ ...filters, entityType: v as CanonicalEntityType | 'all' })}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entity Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {entityTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.sourceSystem || 'all'} onValueChange={v => onChange({ ...filters, sourceSystem: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sources</SelectItem>
        {sourceSystems.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.matchResult} onValueChange={v => onChange({ ...filters, matchResult: v as MatchResult | 'all' })}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Match Result" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Results</SelectItem>
        <SelectItem value="match">Match</SelectItem>
        <SelectItem value="possible">Possible</SelectItem>
        <SelectItem value="no_match">No Match</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filters.approvalStatus} onValueChange={v => onChange({ ...filters, approvalStatus: v as 'all' | 'pending' | 'approved' })}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Approval" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="pending">Pending Approval</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

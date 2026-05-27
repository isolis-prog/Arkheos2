import { Search, Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { AuditLogFilters as Filters } from '@/hooks/useAuditLogs';

interface AuditLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableActions: string[];
  availableEntityTypes: string[];
}

const ACTION_LABELS: Record<string, string> = {
  bulk_assign: 'Bulk Assign',
  bulk_resolve: 'Bulk Resolve',
  bulk_close: 'Bulk Close',
  bulk_create_amendments: 'Create Amendments',
  bulk_export: 'Export',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  exception: 'Exception',
  amendment_plan: 'Amendment Plan',
  match_group: 'Match Group',
};

export function AuditLogFilters({
  filters,
  onFiltersChange,
  availableActions,
  availableEntityTypes,
}: AuditLogFiltersProps) {
  const hasActiveFilters = filters.action || filters.entityType || 
    filters.startDate || filters.endDate || filters.search;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Action Filter */}
      <Select
        value={filters.action || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, action: value })}
      >
        <SelectTrigger className="w-44">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {availableActions.map((action) => (
            <SelectItem key={action} value={action}>
              {ACTION_LABELS[action] || action.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Entity Type Filter */}
      <Select
        value={filters.entityType || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, entityType: value })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Entity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {availableEntityTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {ENTITY_TYPE_LABELS[type] || type.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-44 justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            {filters.startDate ? format(filters.startDate, 'MMM d') : 'Start Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={filters.startDate}
            onSelect={(date) => onFiltersChange({ ...filters, startDate: date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-44 justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            {filters.endDate ? format(filters.endDate, 'MMM d') : 'End Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={filters.endDate}
            onSelect={(date) => onFiltersChange({ ...filters, endDate: date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

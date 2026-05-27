import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from './DateRangeFilter';
import { FilterPresets, FilterState } from './FilterPresets';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ExceptionsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  severity: string;
  onSeverityChange: (value: string) => void;
  breakType: string;
  onBreakTypeChange: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onClearFilters: () => void;
}

export function ExceptionsFilters({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  breakType,
  onBreakTypeChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
}: ExceptionsFiltersProps) {
  const hasActiveFilters =
    status !== 'all' ||
    severity !== 'all' ||
    breakType !== 'all' ||
    dateRange.from !== undefined ||
    searchQuery !== '';

  const currentFilterState: FilterState = {
    status,
    severity,
    breakType,
    dateFrom: dateRange.from?.toISOString(),
    dateTo: dateRange.to?.toISOString(),
  };

  const handleApplyPreset = (filters: FilterState) => {
    onStatusChange(filters.status);
    onSeverityChange(filters.severity);
    onBreakTypeChange(filters.breakType);
    onDateRangeChange({
      from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search by Deal ID..."
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={breakType} onValueChange={onBreakTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Break Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="AMOUNT_MISMATCH">Amount Mismatch</SelectItem>
            <SelectItem value="MISSING_IN_ERP">Missing in ERP</SelectItem>
            <SelectItem value="MISSING_IN_ETRM">Missing in ETRM</SelectItem>
            <SelectItem value="CURRENCY_MISMATCH">Currency Mismatch</SelectItem>
            <SelectItem value="DATE_MISMATCH">Date Mismatch</SelectItem>
            <SelectItem value="DUPLICATE_IN_ERP">Duplicate in ERP</SelectItem>
            <SelectItem value="DUPLICATE_IN_ETRM">Duplicate in ETRM</SelectItem>
          </SelectContent>
        </Select>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      </div>
      
      <div className="flex items-center gap-3">
        <FilterPresets
          currentFilters={currentFilterState}
          onApplyPreset={handleApplyPreset}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

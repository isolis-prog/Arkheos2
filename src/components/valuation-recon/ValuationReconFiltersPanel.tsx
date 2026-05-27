import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MultiSelectFilter } from '@/components/reconciliations/MultiSelectFilter';
import {
  type ReconciliationFilters,
  useReconciliationFilterOptions,
} from '@/hooks/useReconciliationFilters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ReconciliationFilters;
  onUpdateFilter: <K extends keyof ReconciliationFilters>(
    key: K,
    value: ReconciliationFilters[K]
  ) => void;
  onApply: () => void;
  onClear: () => void;
}

export function ValuationReconFiltersPanel({
  open,
  onOpenChange,
  filters,
  onUpdateFilter,
  onApply,
  onClear,
}: Props) {
  const options = useReconciliationFilterOptions();

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow valuation recon results by system, period, and attributes.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">System</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Source System</Label>
                  <Select
                    value={filters.sourceSystem ?? 'all'}
                    onValueChange={(v) =>
                      onUpdateFilter('sourceSystem', v === 'all' ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All</SelectItem>
                      {options.sourceSystems.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Financial System</Label>
                  <Select
                    value={filters.financialSystem ?? 'all'}
                    onValueChange={(v) =>
                      onUpdateFilter('financialSystem', v === 'all' ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="all">All</SelectItem>
                      {options.financialSystems.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Filters</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Period</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePickerField
                      label="Start Date"
                      date={filters.periodStart}
                      onSelect={(d) => onUpdateFilter('periodStart', d)}
                    />
                    <DatePickerField
                      label="End Date"
                      date={filters.periodEnd}
                      onSelect={(d) => onUpdateFilter('periodEnd', d)}
                    />
                  </div>
                </div>

                <MultiSelectFilter
                  label="Internal Legal Entity"
                  options={options.legalEntities}
                  selected={filters.legalEntities}
                  onChange={(v) => onUpdateFilter('legalEntities', v)}
                />
                <MultiSelectFilter
                  label="Counterparty"
                  options={options.counterparties}
                  selected={filters.counterparties}
                  onChange={(v) => onUpdateFilter('counterparties', v)}
                />
                <MultiSelectFilter
                  label="Portfolio"
                  options={options.portfolios}
                  selected={filters.portfolios}
                  onChange={(v) => onUpdateFilter('portfolios', v)}
                />
                <MultiSelectFilter
                  label="Instrument Type"
                  options={options.instrumentTypes}
                  selected={filters.instrumentTypes}
                  onChange={(v) => onUpdateFilter('instrumentTypes', v)}
                />
                <MultiSelectFilter
                  label="Transaction Type"
                  options={options.transactionTypes}
                  selected={filters.transactionTypes}
                  onChange={(v) => onUpdateFilter('transactionTypes', v)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={handleClear}>
            Clear All
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DatePickerField({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-9 text-xs',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {date ? format(date, 'MMM d, yyyy') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[60]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}

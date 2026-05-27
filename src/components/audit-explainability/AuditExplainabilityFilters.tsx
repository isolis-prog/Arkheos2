 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Calendar } from '@/components/ui/calendar';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { CalendarIcon, RotateCcw } from 'lucide-react';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import type { AuditFilters } from '@/hooks/useAuditExplainability';
 
 interface AuditExplainabilityFiltersProps {
   filters: AuditFilters;
   onFiltersChange: (filters: AuditFilters) => void;
   modules: string[];
   users: string[];
 }
 
 const moduleLabels: Record<string, string> = {
   dashboard: 'Dashboard',
   'fx-analytics': 'FX & Treasury',
   'pnl-attribution': 'P&L Attribution',
   valuation: 'Valuation & Curves',
   'close-readiness': 'Close Readiness',
   'data-quality': 'Data Quality',
 };
 
 export function AuditExplainabilityFilters({
   filters,
   onFiltersChange,
   modules,
   users,
 }: AuditExplainabilityFiltersProps) {
   const handleReset = () => {
     onFiltersChange({});
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <Select
         value={filters.module || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, module: value })}
       >
         <SelectTrigger className="w-[180px]">
           <SelectValue placeholder="Module" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Modules</SelectItem>
           {modules.map((module) => (
             <SelectItem key={module} value={module}>
               {moduleLabels[module] || module}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.metricType || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, metricType: value })}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Metric Type" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Metrics</SelectItem>
           <SelectItem value="percentage">Percentages</SelectItem>
           <SelectItem value="currency">Currency</SelectItem>
           <SelectItem value="count">Counts</SelectItem>
         </SelectContent>
       </Select>
 
       <Select
         value={filters.userId || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, userId: value })}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="User" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Users</SelectItem>
           {users.map((user) => (
             <SelectItem key={user} value={user}>
               {user}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Popover>
         <PopoverTrigger asChild>
           <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal')}>
             <CalendarIcon className="mr-2 h-4 w-4" />
             {filters.dateRange?.from ? (
               filters.dateRange.to ? (
                 <>
                   {format(filters.dateRange.from, 'LLL dd')} - {format(filters.dateRange.to, 'LLL dd')}
                 </>
               ) : (
                 format(filters.dateRange.from, 'LLL dd, yyyy')
               )
             ) : (
               <span>Date Range</span>
             )}
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-auto p-0" align="start">
           <Calendar
             initialFocus
             mode="range"
             selected={filters.dateRange}
             onSelect={(range) => 
               onFiltersChange({ 
                 ...filters, 
                 dateRange: range ? { from: range.from!, to: range.to! } : undefined 
               })
             }
             numberOfMonths={2}
           />
         </PopoverContent>
       </Popover>
 
       <Button variant="ghost" size="icon" onClick={handleReset} title="Reset filters">
         <RotateCcw className="h-4 w-4" />
       </Button>
     </div>
   );
 }
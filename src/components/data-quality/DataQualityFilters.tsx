 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Calendar } from '@/components/ui/calendar';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { CalendarIcon, RotateCcw } from 'lucide-react';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import type { DataQualityFilters as Filters } from '@/hooks/useDataQuality';
 
 interface DataQualityFiltersProps {
   filters: Filters;
   onFiltersChange: (filters: Filters) => void;
   legalEntities: string[];
   sourceSystems: string[];
 }
 
 export function DataQualityFilters({
   filters,
   onFiltersChange,
   legalEntities,
   sourceSystems,
 }: DataQualityFiltersProps) {
   const handleReset = () => {
     onFiltersChange({});
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <Select
         value={filters.legalEntity || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, legalEntity: value })}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Legal Entity" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Entities</SelectItem>
           {legalEntities.map((entity) => (
             <SelectItem key={entity} value={entity}>
               {entity}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.sourceSystem || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, sourceSystem: value })}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Source System" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Systems</SelectItem>
           {sourceSystems.map((system) => (
             <SelectItem key={system} value={system}>
               {system}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.qualityDimension || 'all'}
         onValueChange={(value) => onFiltersChange({ ...filters, qualityDimension: value as Filters['qualityDimension'] })}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Dimension" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Dimensions</SelectItem>
           <SelectItem value="completeness">Completeness</SelectItem>
           <SelectItem value="validity">Validity</SelectItem>
           <SelectItem value="timeliness">Timeliness</SelectItem>
           <SelectItem value="consistency">Consistency</SelectItem>
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
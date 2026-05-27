 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { CloseFiltersState } from '@/hooks/useCloseReadiness';
 import { RefreshCw } from 'lucide-react';
 
 interface CloseReadinessFiltersProps {
   filters: CloseFiltersState;
   onFiltersChange: (filters: CloseFiltersState) => void;
   legalEntities: { id: string; name: string }[];
 }
 
 export const CloseReadinessFilters = ({
   filters,
   onFiltersChange,
   legalEntities,
 }: CloseReadinessFiltersProps) => {
   const handleChange = (key: keyof CloseFiltersState, value: string) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   const handleReset = () => {
     onFiltersChange({
       legalEntity: '',
       category: '',
       status: '',
     });
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <Select
         value={filters.legalEntity || 'all'}
         onValueChange={(value) => handleChange('legalEntity', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[180px]">
           <SelectValue placeholder="Legal Entity" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Entities</SelectItem>
           {legalEntities.map((entity) => (
             <SelectItem key={entity.id} value={entity.id}>
               {entity.name}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.category || 'all'}
         onValueChange={(value) => handleChange('category', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Category" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Categories</SelectItem>
           <SelectItem value="recon">Reconciliation</SelectItem>
           <SelectItem value="valuation">Valuation</SelectItem>
           <SelectItem value="fx">FX</SelectItem>
           <SelectItem value="approval">Approvals</SelectItem>
         </SelectContent>
       </Select>
 
       <Select
         value={filters.status || 'all'}
         onValueChange={(value) => handleChange('status', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[140px]">
           <SelectValue placeholder="Status" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Statuses</SelectItem>
           <SelectItem value="ready">Ready</SelectItem>
           <SelectItem value="in_progress">In Progress</SelectItem>
           <SelectItem value="blocked">Blocked</SelectItem>
           <SelectItem value="not_started">Not Started</SelectItem>
         </SelectContent>
       </Select>
 
       <Button variant="outline" size="sm" onClick={handleReset}>
         <RefreshCw className="mr-2 h-4 w-4" />
         Reset
       </Button>
     </div>
   );
 };
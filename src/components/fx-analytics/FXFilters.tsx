 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { FXFiltersState } from '@/hooks/useFXAnalytics';
 import { RefreshCw } from 'lucide-react';
 
 interface FXFiltersProps {
   filters: FXFiltersState;
   onFiltersChange: (filters: FXFiltersState) => void;
   legalEntities: string[];
   currencyPairs: string[];
 }
 
 export const FXFilters = ({
   filters,
   onFiltersChange,
   legalEntities,
   currencyPairs,
 }: FXFiltersProps) => {
   const handleChange = (key: keyof FXFiltersState, value: string) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   const handleReset = () => {
     onFiltersChange({
       legalEntity: '',
       currencyPair: '',
       exposureType: 'all',
       timeBucket: 'monthly',
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
             <SelectItem key={entity} value={entity}>
               {entity}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.currencyPair || 'all'}
         onValueChange={(value) => handleChange('currencyPair', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Currency Pair" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Pairs</SelectItem>
           {currencyPairs.map((pair) => (
             <SelectItem key={pair} value={pair}>
               {pair}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.exposureType}
         onValueChange={(value) => handleChange('exposureType', value as FXFiltersState['exposureType'])}
       >
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Exposure Type" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Exposures</SelectItem>
           <SelectItem value="realized">Realized Only</SelectItem>
           <SelectItem value="unrealized">Unrealized Only</SelectItem>
         </SelectContent>
       </Select>
 
       <Select
         value={filters.timeBucket}
         onValueChange={(value) => handleChange('timeBucket', value as FXFiltersState['timeBucket'])}
       >
         <SelectTrigger className="w-[130px]">
           <SelectValue placeholder="Time Bucket" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="daily">Daily</SelectItem>
           <SelectItem value="weekly">Weekly</SelectItem>
           <SelectItem value="monthly">Monthly</SelectItem>
         </SelectContent>
       </Select>
 
       <Button variant="outline" size="sm" onClick={handleReset}>
         <RefreshCw className="mr-2 h-4 w-4" />
         Reset
       </Button>
     </div>
   );
 };
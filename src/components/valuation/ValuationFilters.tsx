 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { ValuationFiltersState } from '@/hooks/useValuationConsistency';
 import { RefreshCw } from 'lucide-react';
 
 interface ValuationFiltersProps {
   filters: ValuationFiltersState;
   onFiltersChange: (filters: ValuationFiltersState) => void;
   books: string[];
 }
 
 export const ValuationFilters = ({
   filters,
   onFiltersChange,
   books,
 }: ValuationFiltersProps) => {
   const handleChange = (key: keyof ValuationFiltersState, value: string) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   const handleReset = () => {
     onFiltersChange({
       book: '',
       curveType: '',
       alertSeverity: '',
       dateRange: '7d',
     });
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <Select
         value={filters.book || 'all'}
         onValueChange={(value) => handleChange('book', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Book" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Books</SelectItem>
           {books.map((book) => (
             <SelectItem key={book} value={book}>
               {book}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select
         value={filters.curveType || 'all'}
         onValueChange={(value) => handleChange('curveType', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Curve Type" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Curves</SelectItem>
           <SelectItem value="forward">Forward</SelectItem>
           <SelectItem value="spot">Spot</SelectItem>
           <SelectItem value="volatility">Volatility</SelectItem>
           <SelectItem value="discount">Discount</SelectItem>
         </SelectContent>
       </Select>
 
       <Select
         value={filters.alertSeverity || 'all'}
         onValueChange={(value) => handleChange('alertSeverity', value === 'all' ? '' : value)}
       >
         <SelectTrigger className="w-[140px]">
           <SelectValue placeholder="Alert Level" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Alerts</SelectItem>
           <SelectItem value="high">High</SelectItem>
           <SelectItem value="medium">Medium</SelectItem>
           <SelectItem value="low">Low</SelectItem>
         </SelectContent>
       </Select>
 
       <Select
         value={filters.dateRange}
         onValueChange={(value) => handleChange('dateRange', value as ValuationFiltersState['dateRange'])}
       >
         <SelectTrigger className="w-[120px]">
           <SelectValue placeholder="Date Range" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="today">Today</SelectItem>
           <SelectItem value="7d">Last 7 Days</SelectItem>
           <SelectItem value="30d">Last 30 Days</SelectItem>
         </SelectContent>
       </Select>
 
       <Button variant="outline" size="sm" onClick={handleReset}>
         <RefreshCw className="mr-2 h-4 w-4" />
         Reset
       </Button>
     </div>
   );
 };
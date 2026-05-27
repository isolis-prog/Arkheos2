 import { Search } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { TradeFilters } from '@/hooks/useTradeExplorer';
 
 interface TradeSearchFiltersProps {
   filters: TradeFilters;
   onFiltersChange: (filters: TradeFilters) => void;
   filterOptions: {
     books: string[];
     counterparties: string[];
     sourceSystems: string[];
   };
 }
 
 export const TradeSearchFilters = ({
   filters,
   onFiltersChange,
   filterOptions,
 }: TradeSearchFiltersProps) => {
   const updateFilter = <K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <div className="relative flex-1 min-w-[200px]">
         <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
         <Input
           placeholder="Search by Trade ID..."
           value={filters.dealId}
           onChange={(e) => updateFilter('dealId', e.target.value)}
           className="pl-9"
         />
       </div>
 
       <Select value={filters.book} onValueChange={(v) => updateFilter('book', v)}>
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Book/Portfolio" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Books</SelectItem>
           {filterOptions.books.map((book) => (
             <SelectItem key={book} value={book}>
               {book}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select value={filters.counterparty} onValueChange={(v) => updateFilter('counterparty', v)}>
         <SelectTrigger className="w-[180px]">
           <SelectValue placeholder="Counterparty" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Counterparties</SelectItem>
           {filterOptions.counterparties.map((cp) => (
             <SelectItem key={cp} value={cp}>
               {cp}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
 
       <Select value={filters.sourceSystem} onValueChange={(v) => updateFilter('sourceSystem', v)}>
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Source" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Sources</SelectItem>
           {filterOptions.sourceSystems.map((src) => (
             <SelectItem key={src} value={src}>
               {src.toUpperCase()}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   );
 };
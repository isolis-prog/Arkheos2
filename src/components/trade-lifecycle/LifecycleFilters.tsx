 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { LifecycleFilters as Filters, LifecycleStage } from '@/hooks/useTradeLifecycle';
 
 interface LifecycleFiltersProps {
   filters: Filters;
   onFiltersChange: (filters: Filters) => void;
   filterOptions: {
     books: string[];
     counterparties: string[];
     commodities: string[];
   };
   stages: LifecycleStage[];
 }
 
 const stageLabels: Record<LifecycleStage, string> = {
   created: 'Created',
   active: 'Active',
   delivered: 'Delivered',
   settled: 'Settled',
   closed: 'Closed',
 };
 
 export const LifecycleFilters = ({
   filters,
   onFiltersChange,
   filterOptions,
   stages,
 }: LifecycleFiltersProps) => {
   const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   return (
     <div className="flex flex-wrap items-center gap-3">
       <Select value={filters.book} onValueChange={(v) => updateFilter('book', v)}>
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Book" />
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
 
       <Select value={filters.commodity} onValueChange={(v) => updateFilter('commodity', v)}>
         <SelectTrigger className="w-[160px]">
           <SelectValue placeholder="Commodity" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Commodities</SelectItem>
           {filterOptions.commodities.map((c) => (
             <SelectItem key={c} value={c}>
               {c}
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
 
       <Select value={filters.stage} onValueChange={(v) => updateFilter('stage', v)}>
         <SelectTrigger className="w-[150px]">
           <SelectValue placeholder="Stage" />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">All Stages</SelectItem>
           {stages.map((stage) => (
             <SelectItem key={stage} value={stage}>
               {stageLabels[stage]}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   );
 };
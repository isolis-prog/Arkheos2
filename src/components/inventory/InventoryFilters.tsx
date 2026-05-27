import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  sites: string[];
  commodities: string[];
  siteFilter: string;
  setSiteFilter: (v: string) => void;
  commodityFilter: string;
  setCommodityFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  periodFilter: string;
  setPeriodFilter: (v: string) => void;
}

export const InventoryFilters = ({
  sites, commodities,
  siteFilter, setSiteFilter,
  commodityFilter, setCommodityFilter,
  statusFilter, setStatusFilter,
  periodFilter, setPeriodFilter,
}: Props) => (
  <div className="flex flex-wrap gap-3">
    <Select value={siteFilter} onValueChange={setSiteFilter}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sites</SelectItem>
        {sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={commodityFilter} onValueChange={setCommodityFilter}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Commodities" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Commodities</SelectItem>
        {commodities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="depleted">Depleted</SelectItem>
        <SelectItem value="frozen">Frozen</SelectItem>
        <SelectItem value="write_down_pending">Write-down Pending</SelectItem>
      </SelectContent>
    </Select>
    <Select value={periodFilter} onValueChange={setPeriodFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Period" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="2026-01">Jan 2026</SelectItem>
        <SelectItem value="2025-12">Dec 2025</SelectItem>
        <SelectItem value="2025-11">Nov 2025</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

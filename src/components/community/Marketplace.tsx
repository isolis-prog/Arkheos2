import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Download, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { CommunityPack } from '@/hooks/useCommunity';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, string> = { template: '📋', ruleset: '⚙️', connector: '🔌', playbook: '📖' };
const categoryLabels: Record<string, string> = { ap_ar: 'AP/AR', gl: 'General Ledger', commodities: 'Commodities', iso_markets: 'ISO Markets', fx_treasury: 'FX & Treasury', logistics: 'Logistics', general: 'General' };

interface Props {
  packs: CommunityPack[];
  typeFilter: string;
  categoryFilter: string;
  searchQuery: string;
  onTypeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onSelect: (pack: CommunityPack) => void;
}

export const Marketplace = ({ packs, typeFilter, categoryFilter, searchQuery, onTypeChange, onCategoryChange, onSearchChange, onSelect }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    {/* Filters */}
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search packs..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-9" />
      </div>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="template">Templates</SelectItem>
          <SelectItem value="ruleset">Rulesets</SelectItem>
          <SelectItem value="connector">Connectors</SelectItem>
          <SelectItem value="playbook">Playbooks</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="ap_ar">AP/AR</SelectItem>
          <SelectItem value="gl">General Ledger</SelectItem>
          <SelectItem value="commodities">Commodities</SelectItem>
          <SelectItem value="iso_markets">ISO Markets</SelectItem>
          <SelectItem value="fx_treasury">FX & Treasury</SelectItem>
          <SelectItem value="logistics">Logistics</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packs.map(pack => (
        <Card key={pack.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => onSelect(pack)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeIcons[pack.packType]}</span>
                <div>
                  <CardTitle className="text-sm group-hover:text-primary transition-colors">{pack.name}</CardTitle>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {pack.isOfficial && (
                      <Badge className="bg-primary/10 text-primary text-[10px] gap-0.5 px-1.5"><ShieldCheck className="h-3 w-3" /> Official</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] capitalize">{pack.packType}</Badge>
                    <Badge variant="outline" className="text-[10px]">{categoryLabels[pack.category] || pack.category}</Badge>
                  </div>
                </div>
              </div>
              {pack.status === 'in_review' && <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">In Review</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground line-clamp-2">{pack.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {pack.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{pack.avgRating}</span>
                    <span className="text-muted-foreground">({pack.reviewCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-3.5 w-3.5" />
                  <span>{pack.installCount.toLocaleString()}</span>
                </div>
              </div>
              <span className="text-muted-foreground">v{pack.currentVersion}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>by {pack.authorName}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {packs.length === 0 && (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No packs found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    )}
  </motion.div>
);

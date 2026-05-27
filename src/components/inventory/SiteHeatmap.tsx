import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteData {
  site: string;
  totalValue: number;
  lotCount: number;
  commodities: string[];
  agingLots: number;
}

interface Props {
  data: SiteData[];
  onSiteClick: (site: string) => void;
}

const getHeatLevel = (value: number): string => {
  if (value > 30000000) return 'bg-destructive/20 border-destructive/40';
  if (value > 10000000) return 'bg-warning/20 border-warning/40';
  if (value > 2000000) return 'bg-info/20 border-info/40';
  return 'bg-success/20 border-success/40';
};

export const SiteHeatmap = ({ data, onSiteClick }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Inventory by Site
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(site => (
          <button
            key={site.site}
            onClick={() => onSiteClick(site.site)}
            className={cn(
              'rounded-lg border-2 p-4 text-left transition-all hover:shadow-md hover:scale-[1.02]',
              getHeatLevel(site.totalValue)
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{site.site}</h4>
              {site.agingLots > 0 && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {site.agingLots} aging
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold font-mono">
              ${(site.totalValue / 1e6).toFixed(1)}M
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              {site.lotCount} lots · {site.commodities.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
);

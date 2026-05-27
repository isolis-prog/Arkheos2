import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Props {
  title: string;
  icon: React.ReactNode;
  items: [string, number][];
  format?: 'currency' | 'count';
}

const labelMap: Record<string, string> = {
  energy_da: 'Energy DA', energy_rt: 'Energy RT', congestion: 'Congestion',
  losses: 'Losses', uplift: 'Uplift', ancillary_reg: 'Anc. Regulation',
  ancillary_spin: 'Anc. Spinning', capacity: 'Capacity',
  node_mismatch: 'Node Mismatch', missing_interval: 'Missing Interval',
  uplift_allocation: 'Uplift Alloc.', negative_price: 'Negative Price',
  price_delta: 'Price Delta', mw_delta: 'MW Delta',
  timezone_shift: 'Timezone Shift', rounding: 'Rounding',
};

export const ISOBreakdownCard = ({ title, icon, items, format: fmt = 'currency' }: Props) => {
  const maxVal = items.length > 0 ? items[0][1] : 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(([key, val]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{labelMap[key] || key}</span>
              <span className="font-mono text-muted-foreground">
                {fmt === 'currency' ? `$${(val / 1000).toFixed(0)}K` : val}
              </span>
            </div>
            <Progress value={(val / maxVal) * 100} className="h-2" />
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
      </CardContent>
    </Card>
  );
};

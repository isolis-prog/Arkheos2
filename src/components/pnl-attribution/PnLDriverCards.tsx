import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Clock, DollarSign, Layers, PlusCircle, Wrench, HelpCircle, GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PnLAttribution, PnLDriver } from '@/hooks/usePnLAttribution';

interface PnLDriverCardsProps {
  drivers: PnLAttribution[];
  isLoading: boolean;
}

const driverIcons: Record<PnLDriver, React.ElementType> = {
  price: DollarSign,
  basis: GitBranch,
  time_spread: Clock,
  volume: BarChart3,
  fx: RefreshCw,
  fees: Layers,
  new_deals: PlusCircle,
  model_changes: Wrench,
  unexplained: HelpCircle,
};

export const PnLDriverCards = ({ drivers, isLoading }: PnLDriverCardsProps) => {
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(0)}K`;
    return `${sign}$${absValue.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3"><div className="h-16 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter out drivers with negligible amounts for cleaner display
  const significantDrivers = drivers.filter((d) => Math.abs(d.amount) > 0.01 || d.driver === 'unexplained');

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
      {significantDrivers.map((driver) => {
        const Icon = driverIcons[driver.driver];
        const isPositive = driver.amount >= 0;
        const isUnexplained = driver.driver === 'unexplained';

        return (
          <Card key={driver.driver} className={cn(isUnexplained && Math.abs(driver.percentage) > 5 && 'border-warning')}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'rounded-md p-1.5',
                  isUnexplained ? 'bg-muted text-muted-foreground' :
                  isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{driver.label}</p>
                  <p className={cn(
                    'text-sm font-bold',
                    isUnexplained ? 'text-muted-foreground' :
                    isPositive ? 'text-success' : 'text-destructive'
                  )}>
                    {formatCurrency(driver.amount)}
                  </p>
                </div>
                <div className="text-right">
                  {isPositive ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                  <p className="text-[10px] text-muted-foreground">{Math.abs(driver.percentage).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

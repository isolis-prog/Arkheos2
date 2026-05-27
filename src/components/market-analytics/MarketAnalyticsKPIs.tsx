import { Card, CardContent } from '@/components/ui/card';
import { Database, TrendingUp, CloudSun, Star } from 'lucide-react';

interface Props {
  fundamentalsCount: number;
  activeSpreads: number;
  weatherAlerts: number;
  watchlistItems: number;
}

export const MarketAnalyticsKPIs = ({ fundamentalsCount, activeSpreads, weatherAlerts, watchlistItems }: Props) => {
  const cards = [
    { label: 'Fundamental Data Points', value: fundamentalsCount, icon: Database, color: 'text-blue-500' },
    { label: 'Active Spread Pairs', value: activeSpreads, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Weather Alerts', value: weatherAlerts, icon: CloudSun, color: 'text-amber-500' },
    { label: 'Watchlist Items', value: watchlistItems, icon: Star, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

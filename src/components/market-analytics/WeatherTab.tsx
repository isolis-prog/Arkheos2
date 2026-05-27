import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CloudOff } from 'lucide-react';

interface Signal {
  id: string;
  region: string;
  type: string;
  date: string;
  actual: number | null;
  forecast: number;
  tenYrAvg: number;
}

export const WeatherTab = ({ signals }: { signals: Signal[] }) => {
  const alertThreshold = 25; // % deviation from 10yr avg

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {signals.map((s) => {
          const deviation = ((s.forecast - s.tenYrAvg) / s.tenYrAvg) * 100;
          const isAlert = Math.abs(deviation) > alertThreshold;
          return (
            <Card key={s.id} className={isAlert ? 'border-amber-500/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{s.region}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{s.type}</Badge>
                    {isAlert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </div>
                </div>
                <CardDescription className="text-xs">{s.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{s.actual ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground">Actual</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{s.forecast}</p>
                    <p className="text-[10px] text-muted-foreground">Forecast</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-muted-foreground">{s.tenYrAvg}</p>
                    <p className="text-[10px] text-muted-foreground">10yr Avg</p>
                  </div>
                </div>
                {isAlert && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">
                    ⚠ Forecast {deviation > 0 ? '+' : ''}{deviation.toFixed(0)}% vs 10yr average
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed opacity-60">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <CloudOff className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Weather API Integration</p>
            <p className="text-xs">Coming in v2 — automatic HDD/CDD feed from weather data providers</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

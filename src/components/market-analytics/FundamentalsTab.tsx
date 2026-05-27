import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, CloudOff } from 'lucide-react';

interface FundamentalRow {
  id: string;
  commodity: string;
  dataType: string;
  region: string;
  reportDate: string;
  value: number;
  unit: string;
  yoyChange: number;
  vs5yrAvg: number;
  source: string;
}

export const FundamentalsTab = ({ data }: { data: FundamentalRow[] }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{r.commodity}</CardTitle>
              <Badge variant="outline" className="text-xs">{r.dataType}</Badge>
            </div>
            <CardDescription className="text-xs">{r.region} · {r.source}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-foreground">
              {r.value.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{r.unit}</span>
            </p>
            <div className="flex gap-4 text-xs">
              <span className={`flex items-center gap-0.5 ${r.yoyChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {r.yoyChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(r.yoyChange)}% YoY
              </span>
              <span className={`flex items-center gap-0.5 ${r.vs5yrAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {r.vs5yrAvg >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(r.vs5yrAvg)}% vs 5yr Avg
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Report: {r.reportDate}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="border-dashed opacity-60">
      <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
        <CloudOff className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">EIA / API Auto-Feed</p>
          <p className="text-xs">Coming in v2 — external API integration for automatic data ingestion</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

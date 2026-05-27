import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SourceHealth {
  source: string;
  avgScore: number;
}

interface DQScore {
  sourceSystem: string;
  dimension: string;
  score: number;
  recordsChecked: number;
  recordsPassed: number;
}

const sourceLabels: Record<string, string> = {
  etrm: 'ETRM',
  erp: 'ERP',
  ops: 'Operations',
  market_data: 'Market Data',
};

const scoreColor = (s: number) => s >= 90 ? 'text-success' : s >= 80 ? 'text-warning' : 'text-destructive';

export const SourceHealthCards = ({ sourceHealth, scores }: { sourceHealth: SourceHealth[]; scores: DQScore[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {sourceHealth.map(sh => {
      const dims = scores.filter(s => s.sourceSystem === sh.source);
      return (
        <Card key={sh.source}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{sourceLabels[sh.source] || sh.source}</CardTitle>
              <span className={`text-2xl font-bold ${scoreColor(sh.avgScore)}`}>{sh.avgScore}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dims.map(d => (
              <div key={d.dimension} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{d.dimension}</span>
                  <span className="font-medium">{d.score}%</span>
                </div>
                <Progress value={d.score} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    })}
  </div>
);

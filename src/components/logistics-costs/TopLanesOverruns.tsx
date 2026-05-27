import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface Props {
  lanes: [string, number][];
}

export const TopLanesOverruns = ({ lanes }: Props) => {
  const maxVal = lanes.length > 0 ? lanes[0][1] : 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-destructive" /> Top Lanes with Overruns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lanes.map(([lane, amount]) => (
          <div key={lane} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{lane}</span>
              <span className="font-mono text-muted-foreground">${(amount / 1000).toFixed(0)}K</span>
            </div>
            <Progress value={(amount / maxVal) * 100} className="h-2" />
          </div>
        ))}
        {lanes.length === 0 && <p className="text-sm text-muted-foreground">No overruns detected</p>}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface Props {
  specs: [string, number][];
}

export const TopBreachedSpecs = ({ specs }: Props) => {
  const maxCount = specs.length > 0 ? specs[0][1] : 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Top Breached Specs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {specs.map(([name, count]) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{name}</span>
              <span className="font-mono text-muted-foreground">{count}</span>
            </div>
            <Progress value={(count / maxCount) * 100} className="h-2" />
          </div>
        ))}
        {specs.length === 0 && <p className="text-sm text-muted-foreground">No spec breaches recorded</p>}
      </CardContent>
    </Card>
  );
};

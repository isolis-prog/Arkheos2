import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface Test {
  id: string; name: string; description: string; frequency: string; automated: boolean;
  lastResult: string; lastRun: string; exceptions: number;
}

const resultColor: Record<string, string> = {
  PASS: 'bg-emerald-100 text-emerald-800',
  FAIL: 'bg-red-100 text-red-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
};

export const ControlTestsTab = ({ tests }: { tests: Test[] }) => (
  <Card>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Test Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Frequency</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Last Run</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Result</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Exceptions</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">{t.description}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{t.frequency}</Badge></td>
                <td className="p-3 text-muted-foreground">{t.lastRun}</td>
                <td className="p-3">
                  <Badge variant="outline" className={`text-xs ${resultColor[t.lastResult] || ''}`}>{t.lastResult}</Badge>
                </td>
                <td className="p-3 text-right font-mono">{t.exceptions}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost"><Play className="h-3 w-3 mr-1" /> Run</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Policy {
  id: string; commodity: string; certRequired: string; coveragePct: number;
  traceability: string; gaps: string | null;
}

export const SourcingTab = ({ data }: { data: Policy[] }) => (
  <Card>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Commodity</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Certification</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Coverage</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Traceability</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Gaps</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium">{p.commodity}</td>
                <td className="p-3"><Badge variant="outline" className="text-xs">{p.certRequired}</Badge></td>
                <td className="p-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={p.coveragePct} className="h-2 flex-1" />
                    <span className="text-xs font-mono w-8 text-right">{p.coveragePct}%</span>
                  </div>
                </td>
                <td className="p-3"><Badge variant="secondary" className="text-xs">{p.traceability}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{p.gaps || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

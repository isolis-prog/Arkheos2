import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface Flow {
  id: string;
  date: string;
  commodity: string;
  origin: string;
  destination: string;
  volume: number;
  unit: string;
  source: string;
}

export const FlowLogTab = ({ flows }: { flows: Flow[] }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Physical flow observations from public reports and tracking services</p>
      <Button size="sm" variant="outline">
        <Upload className="h-4 w-4 mr-1" /> Import CSV
      </Button>
    </div>
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Commodity</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Origin</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Destination</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Volume</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Unit</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => (
                <tr key={f.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">{f.date}</td>
                  <td className="p-3"><Badge variant="outline">{f.commodity}</Badge></td>
                  <td className="p-3">{f.origin}</td>
                  <td className="p-3">{f.destination}</td>
                  <td className="p-3 text-right font-mono">{f.volume.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{f.unit}</td>
                  <td className="p-3 text-muted-foreground">{f.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

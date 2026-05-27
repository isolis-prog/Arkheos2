import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudOff } from 'lucide-react';

const demoEnvProducts = [
  { id: '1', type: 'VCS Carbon Credit', vintage: 2025, registry: 'Verra', volume: 5000, buyer: 'Internal', seller: 'EcoProject Ltd', status: 'RETIRED' },
  { id: '2', type: 'Gold Standard', vintage: 2025, registry: 'Gold Standard', volume: 3000, buyer: 'Internal', seller: 'CleanEnergy Co', status: 'HELD' },
  { id: '3', type: 'REC (Wind)', vintage: 2026, registry: 'M-RETS', volume: 10000, buyer: 'ClientCorp', seller: 'Internal', status: 'HELD' },
  { id: '4', type: 'I-REC', vintage: 2025, registry: 'I-REC Standard', volume: 7500, buyer: 'Internal', seller: 'SolarFarm Inc', status: 'HELD' },
];

export const EnvProductsTab = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Product Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Vintage</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Registry</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Volume</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Buyer</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Seller</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {demoEnvProducts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.type}</td>
                  <td className="p-3">{p.vintage}</td>
                  <td className="p-3 text-muted-foreground">{p.registry}</td>
                  <td className="p-3 text-right font-mono">{p.volume.toLocaleString()}</td>
                  <td className="p-3">{p.buyer}</td>
                  <td className="p-3">{p.seller}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${p.status === 'RETIRED' ? 'bg-emerald-100 text-emerald-800' : ''}`}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card className="border-dashed opacity-60">
      <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
        <CloudOff className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Registry API Integration</p>
          <p className="text-xs">Coming in v2 — automatic sync with Verra, Gold Standard, M-RETS registries</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

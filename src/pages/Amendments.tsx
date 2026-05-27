import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Download, Check, X, FileOutput } from 'lucide-react';

const amendments = [
  { id: '1', dealId: 'TRD-2024-001', target: 'NetSuite', action: 'CREATE', amount: 1500, status: 'proposed', createdAt: '2024-01-15' },
  { id: '2', dealId: 'TRD-2024-015', target: 'NetSuite', action: 'CREATE', amount: 87500, status: 'approved', createdAt: '2024-01-14' },
  { id: '3', dealId: 'TRD-2024-008', target: 'ETRM', action: 'UPDATE', amount: 2340, status: 'executed', createdAt: '2024-01-13' },
];

export default function Amendments() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Amendments"
        description="Review and approve correction proposals"
        actions={<Button variant="outline"><Download className="mr-2 h-4 w-4" />Export All</Button>}
      />
      <div className="space-y-4">
        {amendments.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono font-semibold">{a.dealId}</p>
                  <p className="text-sm text-muted-foreground">{a.target} • {a.action}</p>
                </div>
                <StatusBadge variant={getStatusVariant(a.status)}>{a.status}</StatusBadge>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-mono font-semibold">${a.amount.toLocaleString()}</p>
                {a.status === 'proposed' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><X className="h-4 w-4" /></Button>
                    <Button size="sm"><Check className="h-4 w-4" /></Button>
                  </div>
                )}
                {a.status === 'approved' && (
                  <Button size="sm"><FileOutput className="mr-2 h-4 w-4" />Export</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

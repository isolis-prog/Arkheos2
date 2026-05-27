import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DD {
  id: string; counterparty: string; riskTier: string; lastReview: string; nextReview: string;
  status: string; issues: string | null;
  checklist: Record<string, boolean>;
}

const tierColor: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-emerald-100 text-emerald-800',
};
const statusColor: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800', OVERDUE: 'bg-red-100 text-red-800', PENDING: 'bg-muted text-muted-foreground',
};
const checkLabels: Record<string, string> = {
  modernSlavery: 'Modern Slavery', humanRights: 'Human Rights', envCert: 'Env Certification',
  sanctions: 'Sanctions', conflictMinerals: 'Conflict Minerals',
};

export const SupplierDDTab = ({ data }: { data: DD[] }) => (
  <div className="space-y-4">
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Counterparty</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Risk Tier</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Last Review</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Next Review</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Checklist</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Issues</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{d.counterparty}</td>
                  <td className="p-3"><Badge variant="outline" className={`text-xs ${tierColor[d.riskTier]}`}>{d.riskTier}</Badge></td>
                  <td className="p-3 text-muted-foreground">{d.lastReview}</td>
                  <td className="p-3 text-muted-foreground">{d.nextReview}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${statusColor[d.status]}`}>
                      {d.status === 'OVERDUE' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {d.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {Object.entries(d.checklist).map(([k, v]) => (
                        <span key={k} title={checkLabels[k]}>
                          {v ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{d.issues || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

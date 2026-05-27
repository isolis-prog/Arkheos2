import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, TrendingDown, Layers, CheckCircle2 } from 'lucide-react';
import type { CreditAlert } from '@/hooks/useCreditExposure';
import { format } from 'date-fns';

interface Props {
  alerts: CreditAlert[];
}

const iconMap: Record<string, typeof AlertTriangle> = {
  breach: AlertTriangle,
  warning: ShieldAlert,
  concentration: Layers,
  aging_deterioration: TrendingDown,
};

const severityColor: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  info: 'bg-blue-500/10 text-blue-700 border-blue-300',
};

export const CreditAlertsPanel = ({ alerts }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Credit Alerts</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts</p>}
      {alerts.map((a) => {
        const Icon = iconMap[a.alertType] || ShieldAlert;
        return (
          <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${severityColor[a.severity]}`}>
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{a.counterparty}</span>
                <Badge variant="outline" className="text-[10px]">{a.alertType.replace('_', ' ')}</Badge>
                {a.isAcknowledged && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
              </div>
              <p className="text-xs mt-0.5">{a.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.createdAt), 'dd MMM yyyy HH:mm')}</p>
            </div>
            {!a.isAcknowledged && (
              <Button variant="ghost" size="sm" className="text-xs h-7">Ack</Button>
            )}
          </div>
        );
      })}
    </CardContent>
  </Card>
);

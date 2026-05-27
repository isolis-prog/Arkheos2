import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloseSignoff } from '@/hooks/useCloseCockpit';
import { ShieldCheck, Clock, XCircle, MinusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  signoffs: CloseSignoff[];
}

const statusConfig = {
  approved: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
  waived: { icon: MinusCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Waived' },
};

export const SignoffGatesPanel = ({ signoffs }: Props) => {
  const grouped = signoffs.reduce<Record<string, CloseSignoff[]>>((acc, s) => {
    (acc[s.legalEntity] ||= []).push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Gate Approvals (SoD)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(grouped).map(([entity, gates]) => (
            <div key={entity}>
              <h4 className="font-semibold text-sm mb-2">{entity}</h4>
              <div className="flex gap-2 flex-wrap">
                {gates.sort((a, b) => a.gateOrder - b.gateOrder).map((gate) => {
                  const cfg = statusConfig[gate.status];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={gate.id}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${cfg.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <div>
                        <span className="font-medium">{gate.gateName}</span>
                        <div className="text-xs text-muted-foreground">
                          {gate.signedOffAt
                            ? formatDistanceToNow(new Date(gate.signedOffAt), { addSuffix: true })
                            : cfg.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

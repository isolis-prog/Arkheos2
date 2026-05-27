import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ClipboardCheck, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface Props {
  pendingReviews: number;
  openBreaches: number;
  desksSignedOff: number;
  totalDesks: number;
  totalIPVReserve: number;
}

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

export function MOControlKPIs({ pendingReviews, openBreaches, desksSignedOff, totalDesks, totalIPVReserve }: Props) {
  const kpis = [
    { label: 'Pending Deal Reviews', value: String(pendingReviews), icon: ClipboardCheck, color: pendingReviews > 0 ? 'text-amber-600' : 'text-emerald-600' },
    { label: 'Open Breaches', value: String(openBreaches), icon: AlertTriangle, color: openBreaches > 0 ? 'text-destructive' : 'text-emerald-600' },
    { label: 'Desks Signed Off', value: `${desksSignedOff}/${totalDesks}`, icon: CheckCircle, color: desksSignedOff === totalDesks ? 'text-emerald-600' : 'text-amber-600' },
    { label: 'IPV Reserve', value: fmt(totalIPVReserve), icon: Shield, color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-muted p-2.5 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FileText, Building2, Banknote } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

interface Props {
  totalLCExposure: number;
  totalFacilityDrawn: number;
  totalOutstandingFinance: number;
}

export function TradeFinanceKPIs({ totalLCExposure, totalFacilityDrawn, totalOutstandingFinance }: Props) {
  const kpis = [
    { label: 'Active LC Exposure', value: fmt(totalLCExposure), icon: FileText, color: 'text-blue-600' },
    { label: 'Facility Drawn', value: fmt(totalFacilityDrawn), icon: Building2, color: 'text-amber-600' },
    { label: 'Outstanding Finance', value: fmt(totalOutstandingFinance), icon: Banknote, color: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

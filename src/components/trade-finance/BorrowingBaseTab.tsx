import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface FacilityWithSnapshot {
  id: string;
  bank_name: string;
  facility_limit: number;
  advance_rate_inventory: number;
  advance_rate_receivables: number;
  maturity_date: string | null;
  status: string;
  latestSnapshot: {
    eligible_inventory_value: number;
    eligible_receivables_value: number;
    borrowing_base_calculated: number;
    drawn_amount: number;
    headroom: number;
    snapshot_date: string;
  };
}

interface Props {
  facilities: FacilityWithSnapshot[];
}

export function BorrowingBaseTab({ facilities }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h3 className="text-lg font-semibold">Borrowing Base Facilities</h3>

      <div className="grid gap-4">
        {facilities.map(f => {
          const utilPct = f.latestSnapshot.borrowing_base_calculated > 0
            ? (f.latestSnapshot.drawn_amount / f.latestSnapshot.borrowing_base_calculated) * 100
            : 0;
          const headroomPct = f.facility_limit > 0
            ? (f.latestSnapshot.headroom / f.facility_limit) * 100
            : 0;
          const isLowHeadroom = headroomPct < 15;

          return (
            <Card key={f.id} className={isLowHeadroom ? 'border-destructive/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{f.bank_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {isLowHeadroom && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <Badge variant={isLowHeadroom ? 'destructive' : 'secondary'}>
                      {isLowHeadroom ? 'Low Headroom' : f.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Facility Limit</p>
                    <p className="font-semibold font-mono">{fmt(f.facility_limit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Borrowing Base</p>
                    <p className="font-semibold font-mono">{fmt(f.latestSnapshot.borrowing_base_calculated)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drawn</p>
                    <p className="font-semibold font-mono">{fmt(f.latestSnapshot.drawn_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Headroom</p>
                    <p className={`font-semibold font-mono ${isLowHeadroom ? 'text-destructive' : 'text-emerald-600'}`}>{fmt(f.latestSnapshot.headroom)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Utilization</span>
                    <span>{utilPct.toFixed(1)}%</span>
                  </div>
                  <Progress value={utilPct} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground border-t pt-3">
                  <div>
                    <p>Eligible Inventory</p>
                    <p className="text-foreground font-medium">{fmt(f.latestSnapshot.eligible_inventory_value)}</p>
                    <p>× {(f.advance_rate_inventory * 100).toFixed(0)}% adv. rate</p>
                  </div>
                  <div>
                    <p>Eligible Receivables</p>
                    <p className="text-foreground font-medium">{fmt(f.latestSnapshot.eligible_receivables_value)}</p>
                    <p>× {(f.advance_rate_receivables * 100).toFixed(0)}% adv. rate</p>
                  </div>
                  <div>
                    <p>Maturity</p>
                    <p className="text-foreground font-medium">{f.maturity_date || '—'}</p>
                  </div>
                  <div>
                    <p>Snapshot Date</p>
                    <p className="text-foreground font-medium">{f.latestSnapshot.snapshot_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

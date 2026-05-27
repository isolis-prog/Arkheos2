import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Building2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import type { CreditFacility } from '@/hooks/useFXTreasury';

interface Props {
  facilities: CreditFacility[];
  totalLimit: number;
  totalDrawn: number;
  totalHeadroom: number;
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
};

export function CreditFacilityTab({ facilities, totalLimit, totalDrawn, totalHeadroom }: Props) {
  const nearMaturity = facilities.filter((f) => f.daysToMaturity <= 60);
  const lowHeadroom = facilities.filter((f) => f.headroomPct < 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Facility Limit" value={fmt(totalLimit)} icon={Building2} subtitle={`${facilities.length} facilities`} />
        <MetricCard title="Total Drawn" value={fmt(totalDrawn)} icon={Building2} subtitle={`${((totalDrawn / totalLimit) * 100).toFixed(0)}% utilization`} />
        <MetricCard title="Total Headroom" value={fmt(totalHeadroom)} icon={Building2} subtitle="Available capacity" variant={totalHeadroom / totalLimit < 0.2 ? 'warning' : 'success'} />
        <MetricCard
          title="Alerts"
          value={nearMaturity.length + lowHeadroom.length}
          icon={AlertTriangle}
          subtitle={`${nearMaturity.length} near maturity, ${lowHeadroom.length} low headroom`}
          variant={nearMaturity.length + lowHeadroom.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {(nearMaturity.length > 0 || lowHeadroom.length > 0) && (
        <div className="space-y-2">
          {nearMaturity.map((f) => (
            <div key={`mat-${f.facilityId}`} className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm"><span className="font-semibold">{f.bankName} {f.facilityType}</span> matures in <span className="font-semibold text-warning">{f.daysToMaturity} days</span> ({f.maturityDate})</p>
            </div>
          ))}
          {lowHeadroom.map((f) => (
            <div key={`hr-${f.facilityId}`} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm"><span className="font-semibold">{f.bankName} {f.facilityType}</span> headroom at <span className="font-semibold text-destructive">{f.headroomPct.toFixed(0)}%</span> ({fmt(f.headroom)} remaining)</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Credit Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead className="text-right">Drawn</TableHead>
                <TableHead className="text-right">Headroom</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((f) => (
                <TableRow key={f.facilityId}>
                  <TableCell className="font-medium">{f.bankName}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{f.facilityType}</Badge></TableCell>
                  <TableCell className="text-right">{fmt(f.limitUsd)}</TableCell>
                  <TableCell className="text-right">{fmt(f.drawnUsd)}</TableCell>
                  <TableCell className={`text-right ${f.headroomPct < 20 ? 'text-destructive font-semibold' : ''}`}>
                    {fmt(f.headroom)} ({f.headroomPct.toFixed(0)}%)
                  </TableCell>
                  <TableCell className="text-right">{f.interestRate.toFixed(2)}%</TableCell>
                  <TableCell className={`text-sm ${f.daysToMaturity <= 60 ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
                    {f.maturityDate}
                  </TableCell>
                  <TableCell>
                    {f.daysToMaturity <= 60 ? (
                      <Badge variant="outline" className="text-xs text-warning border-warning">Near Maturity</Badge>
                    ) : f.headroomPct < 20 ? (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive">Low Headroom</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

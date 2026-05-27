import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Landmark, PieChart } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import type { BankAccount } from '@/hooks/useFXTreasury';

interface Props {
  accounts: BankAccount[];
  totalCashByCurrency: { currency: string; total: number; usdEquivalent: number }[];
  totalCashUsd: number;
  totalAvailableUsd: number;
  bankConcentration: { bank: string; usd: number; pct: number }[];
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
};

export function CashManagementTab({ accounts, totalCashByCurrency, totalCashUsd, totalAvailableUsd, bankConcentration }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Cash (USD Equiv)" value={fmt(totalCashUsd)} icon={Landmark} subtitle={`${accounts.length} accounts`} />
        <MetricCard title="Available Cash" value={fmt(totalAvailableUsd)} icon={Landmark} subtitle="Net of restricted" />
        <MetricCard title="Currencies" value={totalCashByCurrency.length} icon={PieChart} subtitle="Active currencies" />
        <MetricCard
          title="Top Bank Concentration"
          value={`${bankConcentration[0]?.pct.toFixed(0) ?? 0}%`}
          icon={PieChart}
          subtitle={bankConcentration[0]?.bank ?? '-'}
          variant={bankConcentration[0]?.pct > 35 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cash by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">USD Equivalent</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalCashByCurrency.map((c) => (
                  <TableRow key={c.currency}>
                    <TableCell className="font-medium">{c.currency}</TableCell>
                    <TableCell className="text-right">{fmt(c.total)}</TableCell>
                    <TableCell className="text-right">{fmt(c.usdEquivalent)}</TableCell>
                    <TableCell className="text-right">{((c.usdEquivalent / totalCashUsd) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bank Concentration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bankConcentration.map((b) => (
                <div key={b.bank} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.bank}</span>
                    <span className="flex items-center gap-2">
                      {fmt(b.usd)}
                      {b.pct > 35 && <Badge variant="outline" className="text-xs text-warning border-warning">High</Badge>}
                      <span className="text-muted-foreground w-12 text-right">{b.pct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.pct > 35 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Bank Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Restricted</TableHead>
                <TableHead>Value Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.accountId}>
                  <TableCell className="font-medium">{a.bankName}</TableCell>
                  <TableCell><Badge variant="secondary">{a.currency}</Badge></TableCell>
                  <TableCell className="text-right">{fmt(a.currentBalance)}</TableCell>
                  <TableCell className="text-right">{fmt(a.availableBalance)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(a.restrictedBalance)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.valueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

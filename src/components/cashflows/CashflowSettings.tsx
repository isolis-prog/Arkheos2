import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CashflowRuleset } from '@/hooks/useCashflows';
import { Settings, DollarSign, Calendar, Percent, Clock, AlertTriangle } from 'lucide-react';

interface CashflowSettingsProps {
  ruleset: CashflowRuleset | null;
}

export const CashflowSettings = ({ ruleset }: CashflowSettingsProps) => {
  if (!ruleset) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No ruleset configured. Contact admin to set up cashflow parameters.
        </CardContent>
      </Card>
    );
  }

  const settings = [
    { icon: DollarSign, label: 'Base Currency', value: ruleset.base_currency, description: 'Corporate reporting currency for amount_base conversion' },
    { icon: Settings, label: 'FX Policy', value: ruleset.fx_policy.replace(/_/g, ' '), description: 'Method used to convert foreign currencies to base' },
    { icon: Calendar, label: 'Calendar Region', value: ruleset.calendar_region, description: 'Business day calendar for value_date adjustments' },
    { icon: Percent, label: 'Amount Tolerance', value: `${ruleset.tolerance_amount_pct}%`, description: 'Maximum % difference for ETRM↔ERP consolidation matching' },
    { icon: Clock, label: 'Date Tolerance', value: `${ruleset.tolerance_days} days`, description: 'Maximum day difference for value_date matching' },
    { icon: AlertTriangle, label: 'Large Payment Threshold', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: ruleset.base_currency, maximumFractionDigits: 0 }).format(ruleset.large_payment_threshold), description: 'Outflows above this amount trigger alerts' },
    { icon: AlertTriangle, label: 'Concentration Threshold', value: `${ruleset.concentration_threshold_pct}%`, description: 'Maximum % of total volume per single counterparty' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Cashflow Ruleset</CardTitle>
              <CardDescription>Active configuration for cashflow projections and consolidation</CardDescription>
            </div>
            <Badge variant="outline">v{ruleset.ruleset_version}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.map(s => (
              <div key={s.label} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <s.icon className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value Date Priority Rules</CardTitle>
          <CardDescription>Hierarchy applied when determining the expected cash date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { priority: 1, source: 'BANK', rule: 'Bank confirmed date', confidence: 100, status: 'PAID_RECEIVED' },
              { priority: 2, source: 'ERP', rule: 'Payment run date', confidence: 90, status: 'CONFIRMED' },
              { priority: 3, source: 'ERP', rule: 'Invoice due date (adjusted to business day)', confidence: 80, status: 'POSTED' },
              { priority: 4, source: 'ETRM', rule: 'Settlement schedule date', confidence: 60, status: 'FORECAST' },
              { priority: 5, source: 'ETRM', rule: 'Trade delivery end + counterparty template days', confidence: 40, status: 'FORECAST' },
            ].map(r => (
              <div key={r.priority} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {r.priority}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.rule}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{r.source}</Badge>
                    <span className="text-xs text-muted-foreground">→ Confidence: {r.confidence}%</span>
                    <span className="text-xs text-muted-foreground">→ Status: {r.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

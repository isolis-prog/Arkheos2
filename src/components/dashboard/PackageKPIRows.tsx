import { usePackageAccess } from '@/hooks/usePackageAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Container, Shield, Banknote, ClipboardCheck } from 'lucide-react';

const packageKPIs: Record<string, { label: string; icon: typeof Container; items: { label: string; value: string }[] }> = {
  PHYSICAL_OPS: {
    label: 'Operations',
    icon: Container,
    items: [
      { label: 'Active Nominations', value: '12' },
      { label: 'Inventory Discrepancies', value: '2' },
      { label: 'Demurrage Claims Open', value: '1' },
      { label: 'Voyages Active', value: '2' },
    ],
  },
  RISK_TRADING: {
    label: 'Risk',
    icon: Shield,
    items: [
      { label: 'VaR Today', value: '$187K' },
      { label: 'Limits in Warning', value: '0' },
      { label: 'MO Review Queue', value: '3' },
      { label: 'IPV Adjustments', value: '0' },
    ],
  },
  FINANCE_TREASURY: {
    label: 'Finance',
    icon: Banknote,
    items: [
      { label: 'LC Exposure', value: '$3.2M' },
      { label: 'BB Headroom', value: '28%' },
      { label: 'Margin Calls Open', value: '2' },
      { label: 'Credit Near Limit', value: '0' },
    ],
  },
  COMPLIANCE_GOV: {
    label: 'Governance',
    icon: ClipboardCheck,
    items: [
      { label: 'Open Findings', value: '1' },
      { label: 'Control Pass Rate', value: '80%' },
      { label: 'DD Overdue', value: '1' },
      { label: 'ESG Coverage', value: '85%' },
    ],
  },
};

export function PackageKPIRows() {
  const { isPackageActive } = usePackageAccess();

  const activePackageKPIs = Object.entries(packageKPIs).filter(
    ([key]) => isPackageActive(key as any)
  );

  if (activePackageKPIs.length === 0) return null;

  return (
    <div className="space-y-4">
      {activePackageKPIs.map(([key, pkg]) => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-2">
            <pkg.icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{pkg.label}</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {pkg.items.map(item => (
              <Card key={item.label} className="bg-muted/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

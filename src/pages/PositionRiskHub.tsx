import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, ShieldAlert, Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleIdentityBadge } from '@/components/packages/ModuleIdentityBadge';

const hubCards = [
  {
    title: 'Position Keeper',
    icon: BarChart3,
    description: 'Net positions by commodity, hub and desk',
    cta: 'Open Position Keeper',
    route: '/position-keeper',
    stat: '480,000 MMBtu',
    statLabel: 'Gas Desk Net Long',
  },
  {
    title: 'Mark-to-Market',
    icon: TrendingUp,
    description: 'Real-time portfolio valuation',
    cta: 'View MtM',
    route: '/mark-to-market',
    stat: '+$149,900',
    statLabel: 'Unrealized P&L',
    statPositive: true,
  },
  {
    title: 'Risk Limits',
    icon: ShieldAlert,
    description: 'Position and loss limit monitoring',
    cta: 'Monitor Limits',
    route: '/risk-limits',
    stat: '0 breaches',
    statLabel: 'Limits in Warning',
  },
  {
    title: 'VaR Dashboard',
    icon: Activity,
    description: 'Value at Risk and stress scenarios',
    cta: 'View VaR',
    route: '/var-dashboard',
    stat: '$187,000',
    statLabel: '1-Day VaR 95%',
  },
];

const kpiCards = [
  { label: 'Total Net Position', value: '480,000 MMBtu', sublabel: 'Gas Desk dominant' },
  { label: 'Unrealized P&L', value: '+$149,900', sublabel: 'All open positions', positive: true },
  { label: 'Risk Limit Utilization', value: '48%', sublabel: 'Gas Desk (highest)' },
  { label: '1-Day VaR at 95%', value: '$187,000', sublabel: 'Total platform' },
];

export default function PositionRiskHub() {
  return (
    <div className="space-y-6">
      <ModuleIdentityBadge moduleKey="POSITION_RISK" moduleName="Position & Risk" />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Position & Risk</h1>
        <p className="text-muted-foreground mt-1">Real-time position monitoring and risk control</p>
      </div>

      {/* KPI Bar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.label} className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.positive ? 'text-emerald-600' : 'text-foreground'}`}>
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sublabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Cards 2×2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {hubCards.map(card => (
          <Card key={card.title} className="hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-xl font-semibold ${card.statPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                    {card.stat}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.statLabel}</p>
                </div>
                <Button asChild size="sm">
                  <Link to={card.route}>
                    {card.cta} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Strip */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-amber-800 dark:text-amber-200">
            ⚠ CFTC position threshold at 4.8% — Gas Desk.{' '}
            <Link to="/risk-limits" className="underline font-medium">View Risk Limits →</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MetricCard } from '@/components/ui/metric-card';
import { Flag, ToggleRight, ToggleLeft, Layers } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const domainLabels: Record<string, string> = {
  reconciliations: 'Reconciliations',
  exceptions: 'Exceptions',
  insights: 'Insights & Controls',
  cashflows: 'Cashflows',
  logistics: 'Logistics',
  t2c: 'Trade-to-Cash',
  connectors: 'Connectors',
  analytics: 'Analytics',
  rules: 'Rules Engine',
  platform: 'Platform',
};

export const FeatureFlagsPanel = () => {
  const { flags, toggleFlag, domains, stats } = useFeatureFlags();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Flags" value={stats.total} icon={Flag} />
        <MetricCard title="Enabled" value={stats.enabled} icon={ToggleRight} variant="success" />
        <MetricCard title="Disabled" value={stats.disabled} icon={ToggleLeft} />
        <MetricCard title="Domains" value={domains.size} icon={Layers} />
      </div>

      <div className="space-y-6">
        {Array.from(domains.entries()).map(([domain, domainFlags]) => (
          <Card key={domain}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {domainLabels[domain] ?? domain}
                <Badge variant="secondary" className="text-xs">
                  {domainFlags.filter(f => f.is_enabled).length}/{domainFlags.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {domainFlags.map(flag => (
                  <div key={flag.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{flag.display_name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {flag.flag_key}
                        </Badge>
                        {flag.is_global_default && (
                          <Badge variant="secondary" className="text-xs">default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                    </div>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={() => toggleFlag(flag.flag_key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

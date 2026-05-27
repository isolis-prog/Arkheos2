import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import { Shield, Database, Clock, Lock } from 'lucide-react';

const retentionPolicies = [
  { domain: 'reconciliations', table: 'match_groups', retention: 730, archive: true, enabled: true },
  { domain: 'exceptions', table: 'exceptions', retention: 365, archive: true, enabled: true },
  { domain: 'audit', table: 'audit_logs', retention: 2555, archive: true, enabled: true },
  { domain: 'analytics', table: 'anomaly_detections', retention: 365, archive: false, enabled: true },
  { domain: 'connectors', table: 'erp_connector_logs', retention: 180, archive: false, enabled: true },
  { domain: 'platform', table: 'structured_logs', retention: 90, archive: false, enabled: true },
  { domain: 'platform', table: 'domain_events', retention: 180, archive: true, enabled: true },
  { domain: 'platform', table: 'background_jobs', retention: 90, archive: false, enabled: true },
];

export const ObservabilityPanel = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard title="Encryption" value="AES-256" icon={Lock} subtitle="At-rest encryption" variant="success" />
      <MetricCard title="Audit Logs" value="Immutable" icon={Shield} subtitle="Append-only, tamper-proof" variant="success" />
      <MetricCard title="Retention Policies" value={retentionPolicies.length} icon={Database} subtitle="Active data retention rules" />
      <MetricCard title="Tracing" value="Active" icon={Clock} subtitle="Correlation ID end-to-end" variant="info" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Retention Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {retentionPolicies.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.table}</span>
                    <Badge variant="outline" className="text-xs">{p.domain}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.archive ? 'Archive before delete' : 'Delete directly'} • {p.retention} days
                  </p>
                </div>
                <Badge variant={p.enabled ? 'default' : 'secondary'} className="text-xs">
                  {p.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security & Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Encryption at Rest', desc: 'AES-256 via database-level encryption', status: 'active' },
              { label: 'Encryption in Transit', desc: 'TLS 1.3 for all connections', status: 'active' },
              { label: 'Immutable Audit Logs', desc: 'Append-only audit_logs and agent_audit_events', status: 'active' },
              { label: 'Tenant Data Isolation', desc: 'Row-Level Security (RLS) on all tables', status: 'active' },
              { label: 'Correlation Tracing', desc: 'End-to-end correlation_id across events, jobs, logs', status: 'active' },
              { label: 'API Rate Limiting', desc: 'Per-key rate limits with audit logging', status: 'active' },
              { label: 'Secret Management', desc: 'Encrypted vault for API keys and credentials', status: 'active' },
              { label: 'Data Retention', desc: 'Configurable per-tenant retention with archival', status: 'active' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

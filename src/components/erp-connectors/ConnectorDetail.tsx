import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Settings, RefreshCw, Activity, Clock, Server, Shield, Database, AlertTriangle, CheckCircle, XCircle, Info, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { useERPConnectors, ERP_LABELS, type ERPHealth, type ERPRunStatus, type ERPLogLevel } from '@/hooks/useERPConnectors';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const healthColor = (h: ERPHealth) => h === 'green' ? 'text-success' : h === 'yellow' ? 'text-warning' : 'text-destructive';
const runStatusVariant = (s: ERPRunStatus) => {
  const m: Record<ERPRunStatus, 'success' | 'error' | 'info' | 'warning'> = { completed: 'success', failed: 'error', running: 'info', cancelled: 'warning' };
  return m[s];
};
const logIcon = (l: ERPLogLevel) => {
  if (l === 'error') return <XCircle className="h-4 w-4 text-destructive" />;
  if (l === 'warn') return <AlertTriangle className="h-4 w-4 text-warning" />;
  if (l === 'debug') return <Bug className="h-4 w-4 text-muted-foreground" />;
  return <Info className="h-4 w-4 text-info" />;
};

export const ConnectorDetail = () => {
  const { connectorId } = useParams<{ connectorId: string }>();
  const navigate = useNavigate();
  const { connectors, getConnectorRuns, getRunLogs } = useERPConnectors();

  const connector = connectors.find((c) => c.id === connectorId);
  if (!connector) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Connector not found</h2>
        <Button variant="outline" onClick={() => navigate('/integrations/erp-connectors')}>Back to Connectors</Button>
      </div>
    );
  }

  const runs = getConnectorRuns(connector.id);
  const latestRun = runs[0];
  const latestLogs = latestRun ? getRunLogs(latestRun.id) : [];

  const metrics = {
    totalRecords: runs.reduce((sum, r) => sum + ((r.stats as any)?.records_fetched || 0), 0),
    totalErrors: runs.reduce((sum, r) => sum + ((r.stats as any)?.errors || 0), 0),
    avgDuration: runs.filter((r) => (r.stats as any)?.duration_s).length > 0
      ? Math.round(runs.reduce((sum, r) => sum + ((r.stats as any)?.duration_s || 0), 0) / runs.filter((r) => (r.stats as any)?.duration_s).length)
      : 0,
    successRate: runs.length > 0 ? Math.round((runs.filter((r) => r.status === 'completed').length / runs.length) * 100) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/integrations/erp-connectors')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{connector.name}</h1>
              <span className={`h-3 w-3 rounded-full ${connector.health === 'green' ? 'bg-success' : connector.health === 'yellow' ? 'bg-warning' : 'bg-destructive'}`} />
            </div>
            <p className="text-sm text-muted-foreground">{ERP_LABELS[connector.erp_type]} · {connector.environment}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Sync triggered')}>
            <Play className="h-4 w-4 mr-1" />Run Now
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />Edit
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Health', value: connector.health.toUpperCase(), icon: Activity, color: healthColor(connector.health) },
          { label: 'Total Records', value: metrics.totalRecords.toLocaleString(), icon: Database, color: 'text-info' },
          { label: 'Avg Duration', value: `${metrics.avgDuration}s`, icon: Clock, color: 'text-muted-foreground' },
          { label: 'Success Rate', value: `${metrics.successRate}%`, icon: CheckCircle, color: metrics.successRate >= 90 ? 'text-success' : 'text-warning' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {connector.health_message && connector.health !== 'green' && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${connector.health === 'red' ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-warning/30 bg-warning/5 text-warning'}`}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {connector.health_message}
        </div>
      )}

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Sync History</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Objects</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{format(new Date(r.started_at), 'MMM dd HH:mm')}</TableCell>
                      <TableCell><StatusBadge variant={runStatusVariant(r.status)}>{r.status}</StatusBadge></TableCell>
                      <TableCell className="text-sm capitalize">{r.direction}</TableCell>
                      <TableCell className="text-sm">{r.object_types.join(', ')}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{(r.stats as any)?.records_fetched?.toLocaleString() || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{(r.stats as any)?.errors ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{(r.stats as any)?.duration_s ? `${(r.stats as any).duration_s}s` : r.status === 'running' ? '…' : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {runs.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sync runs yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Authentication</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium uppercase">{connector.auth_type.replace('_', ' ')}</span></div>
                {Object.entries(connector.auth_config).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono text-xs">{String(v).startsWith('***') ? '••••••••' : String(v)}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" />Connection</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {Object.entries(connector.connection_config).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono text-xs">{String(v)}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Sync Objects</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {connector.sync_objects.map((o) => <Badge key={o} variant="secondary">{o}</Badge>)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Schedule</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Enabled</span><span className="font-medium">{connector.schedule_enabled ? 'Yes' : 'No'}</span></div>
                {connector.schedule_cron && <div className="flex justify-between"><span className="text-muted-foreground">Cron</span><span className="font-mono text-xs">{connector.schedule_cron}</span></div>}
                {connector.last_sync_at && <div className="flex justify-between"><span className="text-muted-foreground">Last Sync</span><span>{formatDistanceToNow(new Date(connector.last_sync_at), { addSuffix: true })}</span></div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Level</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestLogs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{logIcon(l.level)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), 'HH:mm:ss')}</TableCell>
                      <TableCell className="text-sm">{l.message}</TableCell>
                    </TableRow>
                  ))}
                  {latestLogs.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No logs available</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

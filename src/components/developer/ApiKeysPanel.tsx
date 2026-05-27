import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Key, RotateCcw, Trash2, Copy, Eye, EyeOff, Shield } from 'lucide-react';
import { ApiKey, ApiAuditLog } from '@/hooks/useDeveloperPlatform';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  apiKeys: ApiKey[];
  auditLogs: ApiAuditLog[];
  auditStats: { total: number; errors: number; avgLatency: number; errorRate: number };
}

const statusVariant: Record<string, 'success' | 'error' | 'muted'> = {
  active: 'success', revoked: 'error', expired: 'muted',
};

export const ApiKeysPanel = ({ apiKeys, auditLogs, auditStats }: Props) => {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Active Keys</p><p className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">API Calls (24h)</p><p className="text-2xl font-bold">{auditStats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Avg Latency</p><p className="text-2xl font-bold">{auditStats.avgLatency}ms</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Error Rate</p><p className="text-2xl font-bold text-destructive">{auditStats.errorRate}%</p></CardContent></Card>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">API Keys</CardTitle>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Key</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{key.key_prefix}••••••••</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {key.scopes.slice(0, 3).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {key.scopes.length > 3 && <Badge variant="outline" className="text-xs">+{key.scopes.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{key.rate_limit_per_minute}/min</TableCell>
                  <TableCell><StatusBadge variant={statusVariant[key.status]}>{key.status}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{key.last_used_at ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true }) : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{key.expires_at ? format(new Date(key.expires_at), 'MMM d, yyyy') : 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: 'Key prefix copied' })}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>
                      {key.status === 'active' && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Log Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Audit Log</h3>
        <Button variant="outline" size="sm" onClick={() => setShowLogs(!showLogs)}>
          {showLogs ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showLogs ? 'Hide' : 'Show'} Logs
        </Button>
      </div>

      {showLogs && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Idempotency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.slice(0, 15).map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</TableCell>
                    <TableCell className="text-xs">{log.api_key_name}</TableCell>
                    <TableCell><Badge variant={log.method === 'POST' ? 'default' : 'secondary'} className="text-xs">{log.method}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{log.path}</TableCell>
                    <TableCell>
                      <Badge variant={log.status_code < 400 ? 'secondary' : 'destructive'} className="text-xs font-mono">{log.status_code}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.latency_ms}ms</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.ip_address}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{log.idempotency_key || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

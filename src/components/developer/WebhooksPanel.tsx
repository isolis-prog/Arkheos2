import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Webhook as WebhookIcon, Send, Eye, RotateCcw } from 'lucide-react';
import { Webhook, WebhookDelivery } from '@/hooks/useDeveloperPlatform';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface Props {
  webhooks: Webhook[];
  deliveries: WebhookDelivery[];
  deliveryStats: { total: number; delivered: number; failed: number; successRate: number };
}

const whStatusVariant: Record<string, 'success' | 'warning' | 'muted'> = {
  active: 'success', paused: 'warning', disabled: 'muted',
};

const delStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
  delivered: 'success', retrying: 'warning', failed: 'error', pending: 'muted',
};

export const WebhooksPanel = ({ webhooks, deliveries, deliveryStats }: Props) => {
  const [selectedWh, setSelectedWh] = useState<string | null>(null);
  const filteredDeliveries = selectedWh ? deliveries.filter(d => d.webhook_id === selectedWh) : deliveries;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Active Webhooks</p><p className="text-2xl font-bold">{webhooks.filter(w => w.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Deliveries (24h)</p><p className="text-2xl font-bold">{deliveryStats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Success Rate</p><p className="text-2xl font-bold text-success">{deliveryStats.successRate}%</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{deliveryStats.failed}</p></CardContent></Card>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Webhooks</CardTitle>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Register Webhook</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map(wh => (
                <TableRow key={wh.id} className="cursor-pointer" onClick={() => setSelectedWh(selectedWh === wh.id ? null : wh.id)}>
                  <TableCell className="font-medium">{wh.name}</TableCell>
                  <TableCell><code className="text-xs font-mono text-muted-foreground truncate max-w-[200px] block">{wh.url}</code></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {wh.events.slice(0, 2).map(e => (
                        <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                      ))}
                      {wh.events.length > 2 && <Badge variant="secondary" className="text-xs">+{wh.events.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge variant={whStatusVariant[wh.status]}>{wh.status}</StatusBadge></TableCell>
                  <TableCell className="text-sm">{wh.retry_policy.max_retries}x</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(wh.updated_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">
            Recent Deliveries {selectedWh && <Badge variant="outline" className="ml-2">Filtered</Badge>}
          </CardTitle>
          {selectedWh && <Button variant="outline" size="sm" onClick={() => setSelectedWh(null)}>Clear Filter</Button>}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.slice(0, 15).map(del => (
                <TableRow key={del.id}>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(del.created_at), 'MMM d HH:mm')}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{del.event_type}</Badge></TableCell>
                  <TableCell><StatusBadge variant={delStatusVariant[del.status]}>{del.status}</StatusBadge></TableCell>
                  <TableCell className="text-sm font-mono">{del.attempts}</TableCell>
                  <TableCell>{del.response_status ? <Badge variant={del.response_status < 400 ? 'secondary' : 'destructive'} className="text-xs font-mono">{del.response_status}</Badge> : '—'}</TableCell>
                  <TableCell className="text-xs text-destructive truncate max-w-[150px]">{del.error_message || '—'}</TableCell>
                  <TableCell>{del.status === 'failed' && <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

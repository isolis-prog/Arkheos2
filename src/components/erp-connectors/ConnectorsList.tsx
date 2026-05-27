import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Plug, Activity, Clock, AlertTriangle, MoreHorizontal, Play, Pause, Archive, Copy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { useERPConnectors, ERP_LABELS, type ERPConnectorStatus, type ERPHealth } from '@/hooks/useERPConnectors';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

const healthIcon = (h: ERPHealth) => {
  if (h === 'green') return <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" />;
  if (h === 'yellow') return <span className="h-2.5 w-2.5 rounded-full bg-warning inline-block" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" />;
};

const statusVariant = (s: ERPConnectorStatus) => {
  const map: Record<ERPConnectorStatus, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
    active: 'success', draft: 'info', paused: 'warning', error: 'error', archived: 'muted',
  };
  return map[s];
};

const erpLogo = (type: string) => {
  const colors: Record<string, string> = { sap: 'bg-info/10 text-info', oracle: 'bg-destructive/10 text-destructive', netsuite: 'bg-accent/10 text-accent', dynamics: 'bg-primary/10 text-primary', custom: 'bg-muted text-muted-foreground' };
  const initials: Record<string, string> = { sap: 'SAP', oracle: 'ORA', netsuite: 'NS', dynamics: 'D365', custom: 'API' };
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${colors[type] || colors.custom}`}>
      {initials[type] || 'ERP'}
    </div>
  );
};

export const ConnectorsList = () => {
  const navigate = useNavigate();
  const { connectors, getConnectorRuns, isLoading } = useERPConnectors();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = connectors.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !ERP_LABELS[c.erp_type].toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search connectors…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate('/integrations/erp-connectors/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Connector
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Connectors', value: connectors.length, icon: Plug },
          { label: 'Active', value: connectors.filter((c) => c.status === 'active').length, icon: Activity },
          { label: 'Healthy', value: connectors.filter((c) => c.health === 'green').length, icon: Activity },
          { label: 'Needs Attention', value: connectors.filter((c) => c.health !== 'green').length, icon: AlertTriangle },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <m.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((c, i) => {
          const lastRuns = getConnectorRuns(c.id);
          const lastRun = lastRuns[0];
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/integrations/erp-connectors/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {erpLogo(c.erp_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{c.name}</h3>
                        {healthIcon(c.health)}
                        <StatusBadge variant={statusVariant(c.status)}>{c.status}</StatusBadge>
                        <Badge variant="outline" className="text-xs">{c.environment}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{ERP_LABELS[c.erp_type]}</span>
                        <span>·</span>
                        <span>{c.sync_objects.length} objects</span>
                        {c.schedule_enabled && c.schedule_cron && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.schedule_cron}</span>
                          </>
                        )}
                        {c.last_sync_at && (
                          <>
                            <span>·</span>
                            <span>Last sync: {formatDistanceToNow(new Date(c.last_sync_at), { addSuffix: true })}</span>
                          </>
                        )}
                      </div>
                      {c.health_message && c.health !== 'green' && (
                        <p className="text-xs mt-1 text-warning">{c.health_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {lastRun && (
                        <div className="text-right text-xs text-muted-foreground mr-2 hidden md:block">
                          <p>{(lastRun.stats as any)?.records_fetched?.toLocaleString() || '—'} records</p>
                          <p>{(lastRun.stats as any)?.duration_s ? `${(lastRun.stats as any).duration_s}s` : '—'}</p>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Play className="h-4 w-4 mr-2" />Run Now</DropdownMenuItem>
                          <DropdownMenuItem><Pause className="h-4 w-4 mr-2" />Pause</DropdownMenuItem>
                          <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Archive className="h-4 w-4 mr-2" />Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Plug className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No connectors found</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first ERP connector to start syncing data.</p>
              <Button onClick={() => navigate('/integrations/erp-connectors/new')}>
                <Plus className="h-4 w-4 mr-2" />New Connector
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

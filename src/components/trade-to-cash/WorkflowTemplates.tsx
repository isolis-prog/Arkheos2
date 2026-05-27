import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Play, Pause, Archive, Settings2 } from 'lucide-react';
import { T2CWorkflow } from '@/hooks/useTradeToCash';
import { format } from 'date-fns';

interface Props {
  workflows: T2CWorkflow[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  active: 'success', draft: 'info', paused: 'warning', archived: 'muted',
};

export const WorkflowTemplates = ({ workflows, statusFilter, setStatusFilter, searchQuery, setSearchQuery }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search workflows…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Button><Plus className="h-4 w-4 mr-2" />New Workflow</Button>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Commodity</TableHead>
              <TableHead>Business Unit</TableHead>
              <TableHead>ERP Target</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map(wf => (
              <TableRow key={wf.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{wf.description}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{wf.commodity}</Badge></TableCell>
                <TableCell className="text-sm">{wf.business_unit}</TableCell>
                <TableCell className="text-sm">{wf.erp_target}</TableCell>
                <TableCell><Badge variant="secondary">{wf.steps.length} steps</Badge></TableCell>
                <TableCell><StatusBadge variant={statusVariantMap[wf.status] || 'muted'}>{wf.status}</StatusBadge></TableCell>
                <TableCell>{wf.requires_approval ? <Badge variant="outline" className="text-xs">Required</Badge> : <span className="text-xs text-muted-foreground">No</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(wf.updated_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Settings2 className="h-3.5 w-3.5" /></Button>
                    {wf.status === 'active' ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Pause className="h-3.5 w-3.5" /></Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Play className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </motion.div>
);

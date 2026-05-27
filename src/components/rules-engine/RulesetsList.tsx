import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Copy, GitBranch } from 'lucide-react';
import { Ruleset } from '@/hooks/useRulesEngine';
import { format } from 'date-fns';

interface Props {
  rulesets: Ruleset[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSelect: (id: string) => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'muted'> = {
  active: 'success', review: 'warning', draft: 'info', archived: 'muted',
};

const categoryLabel: Record<string, string> = {
  matching: 'Matching', transform: 'Transform', tolerance: 'Tolerance', exception_policy: 'Exception Policy',
};

const categoryColor: Record<string, string> = {
  matching: 'bg-info/10 text-info border-info/30',
  transform: 'bg-accent/80 text-accent-foreground',
  tolerance: 'bg-warning/10 text-warning border-warning/30',
  exception_policy: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const RulesetsList = ({ rulesets, categoryFilter, setCategoryFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery, onSelect }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search rulesets…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="matching">Matching</SelectItem>
          <SelectItem value="transform">Transform</SelectItem>
          <SelectItem value="tolerance">Tolerance</SelectItem>
          <SelectItem value="exception_policy">Exception Policy</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Button><Plus className="h-4 w-4 mr-2" />New Ruleset</Button>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ruleset</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Use Case</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesets.map(rs => (
              <TableRow key={rs.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(rs.id)}>
                <TableCell>
                  <div>
                    <p className="font-medium">{rs.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{rs.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${categoryColor[rs.category] || ''}`}>
                    {categoryLabel[rs.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{rs.use_case}</TableCell>
                <TableCell><StatusBadge variant={statusVariant[rs.status]}>{rs.status}</StatusBadge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">v{rs.current_version?.version_number || rs.versions[0]?.version_number || 1}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{rs.current_version?.definition.rules.length || 0} rules</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{rs.effective_from || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(rs.updated_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onSelect(rs.id); }}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3.5 w-3.5" /></Button>
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

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { PackInstallation } from '@/hooks/useCommunity';
import { format } from 'date-fns';

const typeIcons: Record<string, string> = { template: '📋', ruleset: '⚙️', connector: '🔌', playbook: '📖' };

interface Props {
  installations: PackInstallation[];
}

export const InstalledPacks = ({ installations }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold">Installed Packs</h3>
      <p className="text-sm text-muted-foreground">Manage packs installed in your tenant</p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Active Packs</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{installations.filter(i => i.isActive).length}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Templates</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{installations.filter(i => i.packType === 'template').length}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Connectors</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{installations.filter(i => i.packType === 'connector').length}</div></CardContent>
      </Card>
    </div>

    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pack</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Installed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installations.map(inst => (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{typeIcons[inst.packType]}</span>
                    {inst.packName}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="text-xs capitalize">{inst.packType}</Badge></TableCell>
                <TableCell className="text-sm">v{inst.versionNumber}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(inst.installedAt), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {inst.isActive ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" /> Active</div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm"><XCircle className="h-4 w-4" /> Inactive</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs"><RefreshCw className="h-3 w-3 mr-1" /> Update</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">Uninstall</Button>
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

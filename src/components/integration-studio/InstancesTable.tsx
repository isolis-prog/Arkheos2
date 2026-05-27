import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ConnectorInstance } from '@/hooks/useIntegrationStudio';

const healthColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy: 'default', degraded: 'secondary', down: 'destructive', unknown: 'outline',
};
const envColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  prod: 'default', staging: 'secondary', dev: 'outline',
};

export const InstancesTable = ({ instances }: { instances: ConnectorInstance[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance</TableHead>
          <TableHead>Connector</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Last Check</TableHead>
          <TableHead className="text-center">Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map(i => (
          <TableRow key={i.id}>
            <TableCell className="font-medium">{i.instanceName}</TableCell>
            <TableCell>{i.connectorName}</TableCell>
            <TableCell><Badge variant={envColors[i.environment]}>{i.environment}</Badge></TableCell>
            <TableCell><Badge variant={healthColors[i.healthStatus]}>{i.healthStatus}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{i.lastHealthCheck ? new Date(i.lastHealthCheck).toLocaleString() : '—'}</TableCell>
            <TableCell className="text-center">{i.isActive ? '✓' : '✗'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

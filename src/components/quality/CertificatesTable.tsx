import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { QualityCertificate } from '@/hooks/useQuality';
import { format } from 'date-fns';

interface Props {
  certificates: QualityCertificate[];
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  evaluated: 'bg-green-500/10 text-green-700 border-green-300',
  disputed: 'bg-red-500/10 text-red-700 border-red-300',
};

export const CertificatesTable = ({ certificates, onSelect }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Delivery</TableHead>
          <TableHead>Commodity</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Lab</TableHead>
          <TableHead>Sample Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Specs</TableHead>
          <TableHead className="text-right">Net Adj.</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map(c => {
          const failCount = c.attrs.filter(a => a.status === 'fail').length;
          const warnCount = c.attrs.filter(a => a.status === 'warn').length;
          return (
            <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(c.id)}>
              <TableCell className="font-mono text-sm">{c.deliveryId}</TableCell>
              <TableCell>{c.commodity}</TableCell>
              <TableCell>{c.counterparty}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.labName}</TableCell>
              <TableCell className="text-sm">{format(new Date(c.sampleDate), 'dd MMM yyyy')}</TableCell>
              <TableCell><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></TableCell>
              <TableCell className="text-right">
                {failCount > 0 && <Badge variant="destructive" className="mr-1">{failCount} fail</Badge>}
                {warnCount > 0 && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">{warnCount} warn</Badge>}
                {failCount === 0 && warnCount === 0 && <Badge variant="outline" className="bg-green-500/10 text-green-700">All pass</Badge>}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                <span className={c.netAdjustment < 0 ? 'text-destructive' : 'text-green-600'}>
                  {c.netAdjustment < 0 ? '-' : '+'}${Math.abs(c.netAdjustment).toLocaleString()}
                </span>
              </TableCell>
              <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

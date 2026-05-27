import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { UomConversion } from '@/hooks/useMeasurements';

interface Props {
  conversions: UomConversion[];
}

export const UomConversionsCard = ({ conversions }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">UoM Conversion Factors</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">From</TableHead>
            <TableHead className="font-semibold">To</TableHead>
            <TableHead className="font-semibold text-right">Factor</TableHead>
            <TableHead className="font-semibold">Commodity</TableHead>
            <TableHead className="font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono">{c.fromUom}</TableCell>
              <TableCell className="font-mono">{c.toUom}</TableCell>
              <TableCell className="font-mono text-right">{c.factor}</TableCell>
              <TableCell>{c.commodity ? <Badge variant="outline">{c.commodity}</Badge> : <span className="text-muted-foreground">Universal</span>}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

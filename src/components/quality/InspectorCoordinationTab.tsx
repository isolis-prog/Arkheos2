import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, Upload, Check, X } from 'lucide-react';

interface InspectorAssignment {
  id: string;
  trade_ref: string;
  voyage_ref: string | null;
  inspector_company: string;
  assigned_date: string;
  inspection_date: string | null;
  port: string;
  scope: string;
  report_received: boolean;
  report_url: string | null;
}

const demoData: InspectorAssignment[] = [
  { id: '1', trade_ref: 'T-2026-1001', voyage_ref: 'V-2026-044', inspector_company: 'SGS SA', assigned_date: '2026-03-28', inspection_date: '2026-04-05', port: 'Bonny Terminal', scope: 'both', report_received: true, report_url: '/reports/sgs-1001.pdf' },
  { id: '2', trade_ref: 'T-2026-1003', voyage_ref: 'V-2026-046', inspector_company: 'Intertek', assigned_date: '2026-04-01', inspection_date: '2026-04-08', port: 'Rotterdam', scope: 'quality', report_received: true, report_url: '/reports/intertek-1003.pdf' },
  { id: '3', trade_ref: 'T-2026-1005', voyage_ref: null, inspector_company: 'Bureau Veritas', assigned_date: '2026-04-05', inspection_date: '2026-04-12', port: 'Antwerp', scope: 'quantity', report_received: false, report_url: null },
  { id: '4', trade_ref: 'T-2026-1008', voyage_ref: 'V-2026-050', inspector_company: 'Inspectorate', assigned_date: '2026-04-03', inspection_date: '2026-04-10', port: 'New Orleans', scope: 'both', report_received: false, report_url: null },
  { id: '5', trade_ref: 'T-2026-1010', voyage_ref: 'V-2026-048', inspector_company: 'SGS SA', assigned_date: '2026-04-02', inspection_date: '2026-04-09', port: 'Fujairah', scope: 'quality', report_received: true, report_url: '/reports/sgs-1010.pdf' },
];

const scopeLabels: Record<string, string> = { both: 'Qty + Qly', quality: 'Quality', quantity: 'Quantity' };

export function InspectorCoordinationTab() {
  const received = demoData.filter(d => d.report_received).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inspector Coordination</h3>
        <Badge variant="outline">{received}/{demoData.length} reports received</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Trade</TableHead>
                <TableHead className="font-semibold">Voyage</TableHead>
                <TableHead className="font-semibold">Inspector</TableHead>
                <TableHead className="font-semibold">Assigned</TableHead>
                <TableHead className="font-semibold">Inspection Date</TableHead>
                <TableHead className="font-semibold">Port</TableHead>
                <TableHead className="font-semibold">Scope</TableHead>
                <TableHead className="font-semibold">Report</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoData.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm font-medium">{d.trade_ref}</TableCell>
                  <TableCell className="font-mono text-xs">{d.voyage_ref || '—'}</TableCell>
                  <TableCell>{d.inspector_company}</TableCell>
                  <TableCell className="text-sm">{d.assigned_date}</TableCell>
                  <TableCell className="text-sm">{d.inspection_date || '—'}</TableCell>
                  <TableCell>{d.port}</TableCell>
                  <TableCell><Badge variant="outline">{scopeLabels[d.scope] || d.scope}</Badge></TableCell>
                  <TableCell>
                    {d.report_received ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                        <a href={d.report_url || '#'} className="text-xs underline">View</a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <X className="h-3.5 w-3.5" />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {!d.report_received && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <Upload className="h-3 w-3" /> Upload
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

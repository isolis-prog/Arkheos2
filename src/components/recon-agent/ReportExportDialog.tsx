import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAgentTools } from '@/hooks/useReconAgent';
import { useToast } from '@/hooks/use-toast';

interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
}

export function ReportExportDialog({ open, onOpenChange, runId }: ReportExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const { generateReport } = useAgentTools();
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const report = await generateReport(runId, format);
      
      // Generate downloadable file
      let content: string;
      let mimeType: string;
      let extension: string;
      
      if (format === 'json') {
        content = JSON.stringify(report, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (format === 'csv') {
        // Convert to CSV
        const matches = report.matches || [];
        const headers = ['left_record_id', 'right_record_id', 'score_total', 'amount_delta', 'date_delta', 'decision_status'];
        const rows = matches.map((m: any) => [
          m.left_record_id,
          m.right_record_id,
          m.score_total,
          m.amount_delta,
          m.date_delta,
          m.decision?.decision_status || 'pending',
        ].join(','));
        content = [headers.join(','), ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        // For PDF, we'll just generate JSON with formatting notes
        content = JSON.stringify({
          ...report,
          _note: 'PDF generation requires server-side processing. This is the raw data.',
        }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        toast({ 
          title: 'PDF Export', 
          description: 'Full PDF generation requires additional setup. Downloading JSON instead.' 
        });
      }
      
      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recon-report-${runId.slice(0, 8)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export complete', description: `Report downloaded as ${extension.toUpperCase()}` });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Export failed', description: 'Could not generate report', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Audit Report
          </DialogTitle>
          <DialogDescription>
            Generate and download a complete audit report for this reconciliation run.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileJson className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">JSON Audit Pack</p>
                  <p className="text-xs text-muted-foreground">
                    Complete data with hashes for compliance
                  </p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileSpreadsheet className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">CSV / Excel</p>
                  <p className="text-xs text-muted-foreground">
                    Matches and decisions in spreadsheet format
                  </p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">PDF Executive Report</p>
                  <p className="text-xs text-muted-foreground">
                    Summary with KPIs and audit footer
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium mb-1">Report includes:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Run metadata (ruleset version, model version)</li>
            <li>• All matched pairs with decision details</li>
            <li>• Open exceptions and reasons</li>
            <li>• Complete audit trail with hashes</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

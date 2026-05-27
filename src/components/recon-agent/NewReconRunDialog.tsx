import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Loader2, Database } from 'lucide-react';
import { generateDemoData, RecordData } from '@/lib/recon-demo-data';
import Papa from 'papaparse';

interface NewReconRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    periodStart: string;
    periodEnd: string;
    sourceAName: string;
    sourceBName: string;
    recordsA: RecordData[];
    recordsB: RecordData[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export function NewReconRunDialog({ open, onOpenChange, onSubmit, isLoading }: NewReconRunDialogProps) {
  const [periodStart, setPeriodStart] = useState('2024-11-01');
  const [periodEnd, setPeriodEnd] = useState('2024-12-31');
  const [sourceAName, setSourceAName] = useState('Source A');
  const [sourceBName, setSourceBName] = useState('Source B');
  const [recordsA, setRecordsA] = useState<RecordData[]>([]);
  const [recordsB, setRecordsB] = useState<RecordData[]>([]);
  const [fileAName, setFileAName] = useState<string | null>(null);
  const [fileBName, setFileBName] = useState<string | null>(null);
  
  const fileARef = useRef<HTMLInputElement>(null);
  const fileBRef = useRef<HTMLInputElement>(null);

  const parseCSV = (file: File): Promise<RecordData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const records = results.data.map((row: any, idx) => ({
            id: `csv-${idx}`,
            external_id: row.external_id || row.id || row.reference || null,
            record_date: row.date || row.record_date || row.posting_date || null,
            amount: parseFloat(row.amount || row.value || '0'),
            currency: row.currency || 'USD',
            counterparty: row.counterparty || row.vendor || row.customer || null,
            description: row.description || row.memo || row.notes || null,
          }));
          resolve(records);
        },
        error: (error) => reject(error),
      });
    });
  };

  const handleFileA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const records = await parseCSV(file);
      setRecordsA(records);
      setFileAName(file.name);
      setSourceAName(file.name.replace('.csv', ''));
    }
  };

  const handleFileB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const records = await parseCSV(file);
      setRecordsB(records);
      setFileBName(file.name);
      setSourceBName(file.name.replace('.csv', ''));
    }
  };

  const handleLoadDemo = () => {
    const demo = generateDemoData(200);
    setRecordsA(demo.sourceA);
    setRecordsB(demo.sourceB);
    setFileAName('Demo ETRM Fees (200 records)');
    setFileBName('Demo NetSuite (210 records)');
    setSourceAName('ETRM Fees');
    setSourceBName('NetSuite Postings');
  };

  const handleSubmit = async () => {
    if (recordsA.length === 0 || recordsB.length === 0) {
      return;
    }
    
    await onSubmit({
      periodStart,
      periodEnd,
      sourceAName,
      sourceBName,
      recordsA,
      recordsB,
    });
    
    // Reset form
    setRecordsA([]);
    setRecordsB([]);
    setFileAName(null);
    setFileBName(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Reconciliation Run</DialogTitle>
          <DialogDescription>
            Upload CSV files for Source A and Source B, or load demo data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Demo Data Button */}
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleLoadDemo}
          >
            <Database className="mr-2 h-4 w-4" />
            Load Demo Data (200 records each with various match scenarios)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or upload CSV files</span>
            </div>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source A</Label>
              <input
                ref={fileARef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileA}
              />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileARef.current?.click()}
              >
                {fileAName ? (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-accent" />
                    <span className="truncate">{fileAName}</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Source A CSV
                  </>
                )}
              </Button>
              {recordsA.length > 0 && (
                <p className="text-xs text-muted-foreground">{recordsA.length} records loaded</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Source B</Label>
              <input
                ref={fileBRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileB}
              />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileBRef.current?.click()}
              >
                {fileBName ? (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-accent" />
                    <span className="truncate">{fileBName}</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Source B CSV
                  </>
                )}
              </Button>
              {recordsB.length > 0 && (
                <p className="text-xs text-muted-foreground">{recordsB.length} records loaded</p>
              )}
            </div>
          </div>

          {/* Source Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceAName">Source A Name</Label>
              <Input
                id="sourceAName"
                value={sourceAName}
                onChange={(e) => setSourceAName(e.target.value)}
                placeholder="e.g., ETRM Fees"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceBName">Source B Name</Label>
              <Input
                id="sourceBName"
                value={sourceBName}
                onChange={(e) => setSourceBName(e.target.value)}
                placeholder="e.g., NetSuite"
              />
            </div>
          </div>

          {/* Expected CSV Format */}
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium mb-1">Expected CSV Headers:</p>
            <code className="text-xs text-muted-foreground">
              external_id, date, amount, currency, counterparty, description
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={recordsA.length === 0 || recordsB.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Run'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

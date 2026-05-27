import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Upload, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';

const batches = [
  { id: '1', name: 'ETRM_Fees_Dec2024.csv', source: 'ETRM', dataset: 'Fees', rows: 1245, status: 'processed', date: '2024-01-15' },
  { id: '2', name: 'NS_FeePostings_Dec2024.csv', source: 'NetSuite', dataset: 'Fee Postings', rows: 1289, status: 'processed', date: '2024-01-15' },
  { id: '3', name: 'ETRM_Fees_Nov2024.csv', source: 'ETRM', dataset: 'Fees', rows: 1198, status: 'processed', date: '2024-12-05' },
];

export default function DataLoads() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader title="Data Loads" description="Upload and manage data ingestion" />
      
      <Card className={`border-2 border-dashed transition-colors ${dragActive ? 'border-accent bg-accent/5' : 'border-border'}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Drop CSV files here</p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
          <Button><FileUp className="mr-2 h-4 w-4" />Select Files</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.source} • {b.dataset} • {b.rows} rows</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{b.date}</span>
                  <StatusBadge variant="success">{b.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

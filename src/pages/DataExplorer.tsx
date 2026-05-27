import { useState } from 'react';
import { Database, FileSpreadsheet, DollarSign, Layers, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataExplorerFilters } from '@/components/data-explorer/DataExplorerFilters';
import { DataExplorerTable } from '@/components/data-explorer/DataExplorerTable';
import { useDataExplorer, CanonicalRecord } from '@/hooks/useDataExplorer';
import { exportToCsv, exportToExcel } from '@/lib/export-utils';
import { toast } from 'sonner';

const EXPORT_COLUMNS: { key: keyof CanonicalRecord; header: string }[] = [
  { key: 'sourceSystem', header: 'Source System' },
  { key: 'dealId', header: 'Deal ID' },
  { key: 'matchKey', header: 'Match Key' },
  { key: 'feeType', header: 'Fee Type' },
  { key: 'strategy', header: 'Strategy' },
  { key: 'counterparty', header: 'Counterparty' },
  { key: 'legalEntity', header: 'Legal Entity' },
  { key: 'amount', header: 'Amount' },
  { key: 'currency', header: 'Currency' },
  { key: 'economicDate', header: 'Economic Date' },
  { key: 'postingDate', header: 'Posting Date' },
  { key: 'docId', header: 'Doc ID' },
  { key: 'lineId', header: 'Line ID' },
];

const DataExplorer = () => {
  const { records, isLoading, filters, setFilters, filterOptions, stats } = useDataExplorer();
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCsv = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportToCsv(records, `canonical-records-${timestamp}`, EXPORT_COLUMNS);
      toast.success(`Exported ${records.length} records to CSV`);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      await exportToExcel(records, `canonical-records-${timestamp}`, EXPORT_COLUMNS);
      toast.success(`Exported ${records.length} records to Excel`);
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Explorer"
        description="Browse and search canonical records from ETRM and NetSuite"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting || isLoading || records.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Records"
          value={stats.totalRecords.toLocaleString()}
          icon={Database}
          subtitle="filtered results"
          isLoading={isLoading}
        />
        <MetricCard
          title="ETRM Fees"
          value={stats.etrmCount.toLocaleString()}
          icon={FileSpreadsheet}
          subtitle={formatCurrency(stats.etrmTotal)}
          isLoading={isLoading}
        />
        <MetricCard
          title="NetSuite Lines"
          value={stats.netsuiteCount.toLocaleString()}
          icon={Layers}
          subtitle={formatCurrency(stats.netsuiteTotal)}
          isLoading={isLoading}
        />
        <MetricCard
          title="Net Difference"
          value={formatCurrency(Math.abs(stats.etrmTotal - stats.netsuiteTotal))}
          icon={DollarSign}
          subtitle={stats.etrmTotal >= stats.netsuiteTotal ? 'ETRM higher' : 'NetSuite higher'}
          variant={Math.abs(stats.etrmTotal - stats.netsuiteTotal) > 10000 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Canonical Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataExplorerFilters
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
          />
          <DataExplorerTable records={records} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExplorer;

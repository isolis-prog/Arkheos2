import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  User,
  Clock,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, getStatusVariant, getBreakVariant } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ExceptionsBulkActionsBar } from '@/components/exceptions/ExceptionsBulkActionsBar';
import { BulkResolveDialog } from '@/components/exceptions/BulkResolveDialog';
import { BulkAssignDialog } from '@/components/exceptions/BulkAssignDialog';
import { ExceptionsFilters } from '@/components/exceptions/ExceptionsFilters';
import { useTeamMembers } from '@/hooks/useExceptionDetails';
import { exportToCsv } from '@/lib/export-utils';

// Demo exceptions data
const exceptions = [
  {
    id: 'exc-1',
    dealId: 'TRD-2024-001',
    breakType: 'AMOUNT_MISMATCH',
    severity: 'high',
    status: 'open',
    sideAAmount: 125000.00,
    sideBAmount: 123500.00,
    delta: 1500.00,
    currency: 'USD',
    strategy: 'Crude Oil Swaps',
    feeType: 'Broker Fee',
    counterparty: 'Goldman Sachs',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-12T10:30:00Z',
    slaDueDate: '2024-01-19T23:59:59Z',
    assignedTo: 'John Smith',
    ownerRole: 'accounting',
  },
  {
    id: 'exc-2',
    dealId: 'TRD-2024-015',
    breakType: 'MISSING_IN_ERP',
    severity: 'critical',
    status: 'in_progress',
    sideAAmount: 87500.00,
    sideBAmount: null,
    delta: 87500.00,
    currency: 'USD',
    strategy: 'Natural Gas Futures',
    feeType: 'Exchange Fee',
    counterparty: 'ICE Clear',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-10T14:00:00Z',
    slaDueDate: '2024-01-17T23:59:59Z',
    assignedTo: 'Jane Doe',
    ownerRole: 'accounting',
  },
  {
    id: 'exc-3',
    dealId: 'TRD-2024-023',
    breakType: 'CURRENCY_MISMATCH',
    severity: 'medium',
    status: 'open',
    sideAAmount: 32000.00,
    sideBAmount: 32000.00,
    delta: 0,
    currency: 'EUR vs USD',
    strategy: 'Power Hedging',
    feeType: 'Commission',
    counterparty: 'Morgan Stanley',
    legalEntity: 'Trading Co. EU',
    createdAt: '2024-01-14T08:00:00Z',
    slaDueDate: '2024-01-21T23:59:59Z',
    assignedTo: null,
    ownerRole: 'accounting',
  },
  {
    id: 'exc-4',
    dealId: 'TRD-2024-045',
    breakType: 'AMOUNT_MISMATCH',
    severity: 'low',
    status: 'pending_approval',
    sideAAmount: 5200.00,
    sideBAmount: 5180.00,
    delta: 20.00,
    currency: 'USD',
    strategy: 'Crude Oil Swaps',
    feeType: 'Admin Fee',
    counterparty: 'BP Trading',
    legalEntity: 'Trading Co. US',
    createdAt: '2024-01-15T11:00:00Z',
    slaDueDate: '2024-01-22T23:59:59Z',
    assignedTo: 'John Smith',
    ownerRole: 'accounting',
  },
];

type ExceptionType = typeof exceptions[0];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    default: return 'muted';
  }
};

export default function Exceptions() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: teamMembers = [] } = useTeamMembers();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [breakTypeFilter, setBreakTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Filter exceptions based on all criteria
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      // Search query filter
      if (searchQuery && !exc.dealId.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && exc.status !== statusFilter) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'all' && exc.severity !== severityFilter) {
        return false;
      }
      // Break type filter
      if (breakTypeFilter !== 'all' && exc.breakType !== breakTypeFilter) {
        return false;
      }
      // Date range filter
      const excDate = new Date(exc.createdAt);
      if (dateRange.from && excDate < dateRange.from) {
        return false;
      }
      if (dateRange.to) {
        const toEnd = new Date(dateRange.to);
        toEnd.setHours(23, 59, 59, 999);
        if (excDate > toEnd) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, statusFilter, severityFilter, breakTypeFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setBreakTypeFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.split(' ')[0] || 'USD',
    }).format(amount);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredExceptions.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const selectedExceptions = filteredExceptions.filter(e => selectedIds.has(e.id));
  const totalSelectedAmount = selectedExceptions.reduce((sum, e) => sum + Math.abs(e.delta), 0);

  const handleBulkResolve = async (status: 'resolved' | 'closed', reasonCode: string, reasonDetails: string) => {
    setIsLoading(true);
    try {
      // In real implementation, this would call Supabase to update exceptions
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${selectedIds.size} exception(s) ${status}`);
      setSelectedIds(new Set());
      setResolveDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to resolve: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAssign = async (userId: string) => {
    setIsLoading(true);
    try {
      // In real implementation, this would call Supabase to update exceptions
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = teamMembers.find(m => m.id === userId);
      toast.success(`${selectedIds.size} exception(s) assigned to ${user?.full_name || user?.email}`);
      setSelectedIds(new Set());
      setAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to assign: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const data = selectedExceptions.map(e => ({
      'Deal ID': e.dealId,
      'Break Type': e.breakType.replace(/_/g, ' '),
      'Severity': e.severity,
      'Status': e.status.replace(/_/g, ' '),
      'Side A Amount': e.sideAAmount,
      'Side B Amount': e.sideBAmount,
      'Delta': e.delta,
      'Currency': e.currency,
      'Strategy': e.strategy,
      'Fee Type': e.feeType,
      'Counterparty': e.counterparty,
      'Legal Entity': e.legalEntity,
      'Assigned To': e.assignedTo || '',
      'SLA Due Date': new Date(e.slaDueDate).toLocaleDateString(),
    }));
    
    exportToCsv(data, `exceptions-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedExceptions.length} exception(s)`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exceptions Inbox"
        description="Review and resolve reconciliation breaks"
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">3</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-warning">12</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amount at Risk</p>
                <p className="text-2xl font-bold">$248.5K</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExceptionsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        severity={severityFilter}
        onSeverityChange={setSeverityFilter}
        breakType={breakTypeFilter}
        onBreakTypeChange={setBreakTypeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk Actions Bar */}
      <ExceptionsBulkActionsBar
        selectedCount={selectedIds.size}
        totalAmount={totalSelectedAmount}
        onAssign={() => setAssignDialogOpen(true)}
        onResolve={() => setResolveDialogOpen(true)}
        onExport={handleExport}
        onClearSelection={() => setSelectedIds(new Set())}
        isLoading={isLoading}
      />

      {/* Select All Header */}
      {filteredExceptions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === filteredExceptions.length && filteredExceptions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size === filteredExceptions.length ? 'Deselect all' : 'Select all'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {filteredExceptions.length} of {exceptions.length} exceptions
          </span>
        </div>
      )}

      {filteredExceptions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No exceptions match your filters
        </div>
      )}

      {/* Exceptions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredExceptions.map((exc, index) => (
            <motion.div
              key={exc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`transition-all hover:border-accent/50 ${selectedIds.has(exc.id) ? 'ring-2 ring-primary/50 border-primary/50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.has(exc.id)}
                      onCheckedChange={(checked) => handleSelectOne(exc.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Main content - clickable */}
                    <div 
                      className="flex-1 flex items-center justify-between cursor-pointer"
                      onClick={() => navigate(`/exceptions/${exc.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{exc.dealId}</span>
                            <StatusBadge variant={getBreakVariant(exc.breakType)}>
                              {exc.breakType.replace(/_/g, ' ')}
                            </StatusBadge>
                            <StatusBadge variant={getSeverityColor(exc.severity) as any}>
                              {exc.severity}
                            </StatusBadge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{exc.strategy}</span>
                            <span>•</span>
                            <span>{exc.feeType}</span>
                            <span>•</span>
                            <span>{exc.counterparty}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-mono font-semibold text-destructive">
                            {formatCurrency(exc.delta, exc.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">Delta</p>
                        </div>
                        
                        <div className="text-right">
                          <StatusBadge variant={getStatusVariant(exc.status)}>
                            {exc.status.replace(/_/g, ' ')}
                          </StatusBadge>
                          {exc.assignedTo && (
                            <p className="text-xs text-muted-foreground mt-1">{exc.assignedTo}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {getDaysRemaining(exc.slaDueDate) > 0 ? (
                            <p className="text-sm">
                              <span className={getDaysRemaining(exc.slaDueDate) <= 2 ? 'text-warning' : ''}>
                                {getDaysRemaining(exc.slaDueDate)}d left
                              </span>
                            </p>
                          ) : (
                            <p className="text-sm text-destructive">Overdue</p>
                          )}
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <BulkResolveDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        selectedExceptions={selectedExceptions.map(e => ({ id: e.id, delta: e.delta, currency: e.currency }))}
        onResolve={handleBulkResolve}
        isLoading={isLoading}
      />

      <BulkAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedCount={selectedIds.size}
        teamMembers={teamMembers}
        onAssign={handleBulkAssign}
        isLoading={isLoading}
      />
    </div>
  );
}

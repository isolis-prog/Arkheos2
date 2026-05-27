import { useState, useMemo } from 'react';
import { XCircle, ChevronDown, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, getBreakVariant, getStatusVariant } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BulkActionsBar } from './BulkActionsBar';
import { AssignUserDialog } from './AssignUserDialog';
import { CreateAmendmentsDialog } from './CreateAmendmentsDialog';
import { BatchResolveDialog } from './BatchResolveDialog';
import { BreakDetailPanel } from './BreakDetailPanel';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { BreakDetail, MatchRecord } from '@/hooks/useMatchReviewData';

interface BreaksTableProps {
  breaks: BreakDetail[];
  etrmRecords: MatchRecord[];
  netsuiteRecords: MatchRecord[];
  isLoading: boolean;
}

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'muted';
  }
};

export function BreaksTable({ 
  breaks, 
  etrmRecords, 
  netsuiteRecords, 
  isLoading 
}: BreaksTableProps) {
  const { toast } = useToast();
  const { logBulkAssign, logBulkResolve, logBulkCreateAmendments, logBulkExport } = useAuditLog();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [breakTypeFilter, setBreakTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [amendmentsDialogOpen, setAmendmentsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique break types for filter
  const breakTypes = [...new Set(breaks.map(b => b.breakType))];

  // Filter breaks
  const filteredBreaks = useMemo(() => {
    return breaks.filter(b => {
      const matchesSearch = b.matchGroup.matchKey.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = breakTypeFilter === 'all' || b.breakType === breakTypeFilter;
      const matchesSeverity = severityFilter === 'all' || b.severity.toLowerCase() === severityFilter;
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [breaks, searchTerm, breakTypeFilter, severityFilter]);

  // Create lookup maps
  const etrmMap = useMemo(() => {
    const map = new Map<string, MatchRecord>();
    etrmRecords.forEach(r => {
      const key = `${r.dealId}|${r.feeType}|${r.strategy}`;
      map.set(key, r);
    });
    return map;
  }, [etrmRecords]);

  const netsuiteMap = useMemo(() => {
    const map = new Map<string, MatchRecord>();
    netsuiteRecords.forEach(r => {
      const key = `${r.dealId}|${r.feeType}|${r.strategy}`;
      map.set(key, r);
    });
    return map;
  }, [netsuiteRecords]);

  // Calculate totals
  const totalAmountAtRisk = filteredBreaks.reduce((sum, b) => sum + b.amountAtRisk, 0);

  // Selection handlers
  const isAllSelected = filteredBreaks.length > 0 && filteredBreaks.every(b => selectedIds.has(b.id));
  const isSomeSelected = filteredBreaks.some(b => selectedIds.has(b.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredBreaks.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedBreaks = filteredBreaks.filter(b => selectedIds.has(b.id));

  // Bulk action handlers
  const handleAssign = async (userId: string, userName: string) => {
    setIsProcessing(true);
    const entityIds = Array.from(selectedIds);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log audit event
    await logBulkAssign(entityIds, userId, userName);
    
    toast({
      title: 'Breaks Assigned',
      description: `${selectedIds.size} break(s) assigned to ${userName}`,
    });
    
    setIsProcessing(false);
    setAssignDialogOpen(false);
    setSelectedIds(new Set());
  };

  const handleCreateAmendments = async (targetSystem: string, actionType: string, rationale: string) => {
    setIsProcessing(true);
    const entityIds = Array.from(selectedIds);
    const totalAmount = selectedBreaks.reduce((sum, b) => sum + b.amountAtRisk, 0);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log audit event
    await logBulkCreateAmendments(entityIds, targetSystem, actionType, rationale, totalAmount);
    
    toast({
      title: 'Amendments Created',
      description: `${selectedIds.size} amendment plan(s) created for ${targetSystem}`,
    });
    
    setIsProcessing(false);
    setAmendmentsDialogOpen(false);
    setSelectedIds(new Set());
  };

  const handleResolve = async (status: 'resolved' | 'closed', reasonCode: string, reasonDetails: string) => {
    setIsProcessing(true);
    const entityIds = Array.from(selectedIds);
    const totalAmountAtRisk = selectedBreaks.reduce((sum, b) => sum + b.amountAtRisk, 0);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Log audit event
    await logBulkResolve(entityIds, status, reasonCode, reasonDetails, totalAmountAtRisk);
    
    toast({
      title: `Breaks ${status === 'resolved' ? 'Resolved' : 'Closed'}`,
      description: `${selectedIds.size} break(s) marked as ${status} with reason: ${reasonCode.replace(/_/g, ' ')}`,
    });
    
    setIsProcessing(false);
    setResolveDialogOpen(false);
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    const entityIds = Array.from(selectedIds);
    // Create CSV content
    const headers = ['Match Key', 'Break Type', 'Severity', 'ETRM Amount', 'NetSuite Amount', 'Delta', 'Status', 'Amount at Risk'];
    const rows = selectedBreaks.map(b => [
      b.matchGroup.matchKey,
      b.breakType,
      b.severity,
      b.matchGroup.sideATotal,
      b.matchGroup.sideBTotal,
      b.matchGroup.delta,
      b.status,
      b.amountAtRisk,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = `breaks-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.download = fileName;
    link.click();
    
    // Log audit event
    await logBulkExport(entityIds, 'csv', fileName);
    
    toast({
      title: 'Export Complete',
      description: `${selectedIds.size} break(s) exported to CSV`,
    });
    
    setSelectedIds(new Set());
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Breaks</CardTitle>
            <StatusBadge variant="error">{breaks.length}</StatusBadge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-muted-foreground">Amount at Risk:</span>
            <span className="font-mono font-semibold text-destructive">
              {formatCurrency(totalAmountAtRisk)}
            </span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search by match key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={breakTypeFilter} onValueChange={setBreakTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Break Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Break Types</SelectItem>
              {breakTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onAssign={() => setAssignDialogOpen(true)}
          onCreateAmendments={() => setAmendmentsDialogOpen(true)}
          onExport={handleExport}
          onResolve={() => setResolveDialogOpen(true)}
          onClearSelection={() => setSelectedIds(new Set())}
          isLoading={isProcessing}
        />

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected && !isAllSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead>Match Key</TableHead>
                <TableHead>Break Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">ETRM Amount</TableHead>
                <TableHead className="text-right">NetSuite Amount</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBreaks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No breaks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBreaks.map((breakItem) => {
                  const isExpanded = expandedRow === breakItem.id;
                  const isSelected = selectedIds.has(breakItem.id);
                  const etrmRecord = etrmMap.get(breakItem.matchGroup.matchKey);
                  const netsuiteRecord = netsuiteMap.get(breakItem.matchGroup.matchKey);

                  return (
                    <>
                      <TableRow 
                        key={breakItem.id}
                        className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : breakItem.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(breakItem.id, checked as boolean)}
                            aria-label={`Select break ${breakItem.matchGroup.matchKey}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {breakItem.matchGroup.matchKey}
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={getBreakVariant(breakItem.breakType)}>
                            {breakItem.breakType.replace(/_/g, ' ')}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={getSeverityColor(breakItem.severity) as any}>
                            {breakItem.severity}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(breakItem.matchGroup.sideATotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(breakItem.matchGroup.sideBTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {formatCurrency(breakItem.matchGroup.delta)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={getStatusVariant(breakItem.status)}>
                            {breakItem.status.replace(/_/g, ' ')}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link to="/exceptions">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {isExpanded && (
                          <TableRow key={`${breakItem.id}-detail`}>
                            <TableCell colSpan={10} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <BreakDetailPanel 
                                  breakItem={breakItem}
                                  etrmRecord={etrmRecord}
                                  netsuiteRecord={netsuiteRecord}
                                />
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialogs */}
      <AssignUserDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedCount={selectedIds.size}
        onAssign={handleAssign}
        isLoading={isProcessing}
      />
      <CreateAmendmentsDialog
        open={amendmentsDialogOpen}
        onOpenChange={setAmendmentsDialogOpen}
        selectedBreaks={selectedBreaks}
        onCreate={handleCreateAmendments}
        isLoading={isProcessing}
      />
      <BatchResolveDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        selectedBreaks={selectedBreaks}
        onResolve={handleResolve}
        isLoading={isProcessing}
      />
    </Card>
  );
}

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, User, Clock, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuditLogEntry } from '@/hooks/useAuditLogs';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
}

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  bulk_assign: 'info',
  bulk_resolve: 'success',
  bulk_close: 'muted',
  bulk_create_amendments: 'warning',
  bulk_export: 'info',
};

const ACTION_LABELS: Record<string, string> = {
  bulk_assign: 'Bulk Assign',
  bulk_resolve: 'Bulk Resolve',
  bulk_close: 'Bulk Close',
  bulk_create_amendments: 'Create Amendments',
  bulk_export: 'Export',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  exception: 'Exception',
  amendment_plan: 'Amendment',
  match_group: 'Match Group',
};

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function AuditLogDetails({ log }: { log: AuditLogEntry }) {
  const afterState = log.after_state || {};
  
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-muted/30 border-t space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Metadata */}
          {afterState.metadata && typeof afterState.metadata === 'object' && (
            <div className="col-span-2">
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">
                {(afterState.metadata as Record<string, unknown>).action_description as string || 'No description'}
              </p>
            </div>
          )}
          
          {/* Affected Count */}
          {afterState.affected_count && (
            <div>
              <h4 className="text-sm font-medium mb-1">Affected Records</h4>
              <p className="text-sm text-muted-foreground">{afterState.affected_count as number}</p>
            </div>
          )}

          {/* Amount at Risk */}
          {afterState.metadata && typeof afterState.metadata === 'object' && 
           (afterState.metadata as Record<string, unknown>).total_amount_at_risk && (
            <div>
              <h4 className="text-sm font-medium mb-1">Amount at Risk</h4>
              <p className="text-sm font-mono text-destructive">
                ${((afterState.metadata as Record<string, unknown>).total_amount_at_risk as number).toLocaleString()}
              </p>
            </div>
          )}

          {/* Target System */}
          {afterState.target_system && (
            <div>
              <h4 className="text-sm font-medium mb-1">Target System</h4>
              <p className="text-sm text-muted-foreground">{afterState.target_system as string}</p>
            </div>
          )}

          {/* Status */}
          {afterState.status && (
            <div>
              <h4 className="text-sm font-medium mb-1">New Status</h4>
              <StatusBadge variant={afterState.status === 'resolved' ? 'success' : 'muted'}>
                {(afterState.status as string).replace(/_/g, ' ')}
              </StatusBadge>
            </div>
          )}

          {/* Reason Code */}
          {afterState.reason_code && (
            <div>
              <h4 className="text-sm font-medium mb-1">Reason Code</h4>
              <p className="text-sm text-muted-foreground">
                {(afterState.reason_code as string).replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Assigned To */}
          {afterState.assigned_to_name && (
            <div>
              <h4 className="text-sm font-medium mb-1">Assigned To</h4>
              <p className="text-sm text-muted-foreground">{afterState.assigned_to_name as string}</p>
            </div>
          )}

          {/* Export File */}
          {afterState.file_name && (
            <div>
              <h4 className="text-sm font-medium mb-1">Export File</h4>
              <p className="text-sm font-mono text-muted-foreground">{afterState.file_name as string}</p>
            </div>
          )}
        </div>

        {/* User Agent */}
        {log.user_agent && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-1">User Agent</h4>
            <p className="text-xs text-muted-foreground/70 truncate">{log.user_agent}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No audit logs found</p>
        <p className="text-sm">Try adjusting your filters or perform some actions to generate logs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRow === log.id;
            const afterState = log.after_state || {};
            const metadata = (afterState.metadata as Record<string, unknown>) || {};
            
            return (
              <>
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy') : '-'}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={ACTION_VARIANTS[log.action] || 'muted'}>
                      {ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                      </span>
                      {log.entity_id && (
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {log.entity_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.actor ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={log.actor.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(log.actor.full_name, log.actor.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {log.actor.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.actor.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {metadata.action_description as string || 
                       `${afterState.affected_count || 1} record(s) affected`}
                    </span>
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {isExpanded && (
                    <TableRow key={`${log.id}-detail`}>
                      <TableCell colSpan={6} className="p-0">
                        <AuditLogDetails log={log} />
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

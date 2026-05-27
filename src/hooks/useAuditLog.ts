import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export type AuditAction = 
  | 'bulk_assign'
  | 'bulk_resolve'
  | 'bulk_close'
  | 'bulk_create_amendments'
  | 'bulk_export';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: 'exception' | 'amendment_plan' | 'match_group';
  entityIds: string[];
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user, profile } = useAuth();

  const logAuditEvent = useCallback(async (entry: AuditLogEntry) => {
    if (!user || !profile) {
      console.warn('Cannot log audit event: user not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get user agent and prepare audit entries
      const userAgent = navigator.userAgent;
      
      // Create an audit log entry for each entity affected
      const auditEntries = entry.entityIds.map(entityId => ({
        action: entry.action,
        actor_id: user.id,
        entity_type: entry.entityType,
        entity_id: entityId,
        tenant_id: profile.tenant_id,
        before_state: (entry.beforeState || null) as Json,
        after_state: ({
          ...entry.afterState,
          metadata: entry.metadata,
          affected_count: entry.entityIds.length,
          timestamp: new Date().toISOString(),
        }) as Json,
        user_agent: userAgent,
      }));

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntries);

      if (error) {
        console.error('Failed to create audit log:', error);
        return { success: false, error: error.message };
      }

      console.log(`Audit log created for ${entry.action} on ${entry.entityIds.length} entities`);
      return { success: true };
    } catch (err) {
      console.error('Error creating audit log:', err);
      return { success: false, error: String(err) };
    }
  }, [user, profile]);

  const logBulkAssign = useCallback(async (
    entityIds: string[],
    assignedToUserId: string,
    assignedToUserName: string
  ) => {
    return logAuditEvent({
      action: 'bulk_assign',
      entityType: 'exception',
      entityIds,
      afterState: {
        assigned_to: assignedToUserId,
        assigned_to_name: assignedToUserName,
      },
      metadata: {
        action_description: `Assigned ${entityIds.length} break(s) to ${assignedToUserName}`,
      },
    });
  }, [logAuditEvent]);

  const logBulkResolve = useCallback(async (
    entityIds: string[],
    status: 'resolved' | 'closed',
    reasonCode: string,
    reasonDetails?: string,
    totalAmountAtRisk?: number
  ) => {
    return logAuditEvent({
      action: status === 'resolved' ? 'bulk_resolve' : 'bulk_close',
      entityType: 'exception',
      entityIds,
      afterState: {
        status,
        reason_code: reasonCode,
        reason_details: reasonDetails,
        resolved_at: new Date().toISOString(),
      },
      metadata: {
        action_description: `${status === 'resolved' ? 'Resolved' : 'Closed'} ${entityIds.length} break(s) with reason: ${reasonCode}`,
        total_amount_at_risk: totalAmountAtRisk,
      },
    });
  }, [logAuditEvent]);

  const logBulkCreateAmendments = useCallback(async (
    entityIds: string[],
    targetSystem: string,
    actionType: string,
    rationale?: string,
    totalAmount?: number
  ) => {
    return logAuditEvent({
      action: 'bulk_create_amendments',
      entityType: 'amendment_plan',
      entityIds,
      afterState: {
        target_system: targetSystem,
        action_type: actionType,
        rationale,
        status: 'proposed',
      },
      metadata: {
        action_description: `Created ${entityIds.length} amendment plan(s) for ${targetSystem} with action ${actionType}`,
        total_amount: totalAmount,
      },
    });
  }, [logAuditEvent]);

  const logBulkExport = useCallback(async (
    entityIds: string[],
    exportFormat: string,
    fileName: string
  ) => {
    return logAuditEvent({
      action: 'bulk_export',
      entityType: 'exception',
      entityIds,
      afterState: {
        export_format: exportFormat,
        file_name: fileName,
        exported_at: new Date().toISOString(),
      },
      metadata: {
        action_description: `Exported ${entityIds.length} break(s) to ${exportFormat.toUpperCase()}`,
      },
    });
  }, [logAuditEvent]);

  return {
    logAuditEvent,
    logBulkAssign,
    logBulkResolve,
    logBulkCreateAmendments,
    logBulkExport,
  };
}

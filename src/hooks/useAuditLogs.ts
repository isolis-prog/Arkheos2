import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  tenant_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string | null;
  actor?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.actorId && filters.actorId !== 'all') {
        query = query.eq('actor_id', filters.actorId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      // Apply text search filter client-side
      let results = (data || []) as AuditLogEntry[];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(log => {
          const actionMatch = log.action.toLowerCase().includes(searchLower);
          const entityMatch = log.entity_type.toLowerCase().includes(searchLower);
          const actorMatch = log.actor?.full_name?.toLowerCase().includes(searchLower) ||
                            log.actor?.email.toLowerCase().includes(searchLower);
          const detailsMatch = JSON.stringify(log.after_state || {}).toLowerCase().includes(searchLower);
          return actionMatch || entityMatch || actorMatch || detailsMatch;
        });
      }

      return results;
    },
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['audit-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit log stats:', error);
        throw error;
      }

      const logs = data || [];
      
      // Get unique actions and entity types
      const actions = [...new Set(logs.map(l => l.action))];
      const entityTypes = [...new Set(logs.map(l => l.entity_type))];
      
      // Count by action
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count last 24 hours
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = logs.filter(l => new Date(l.created_at!) > last24h).length;

      return {
        actions,
        entityTypes,
        actionCounts,
        totalCount: logs.length,
        recentCount,
      };
    },
  });
}

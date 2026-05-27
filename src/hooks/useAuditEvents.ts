import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationContext } from '@/lib/infrastructure/correlation';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export type AuditEventAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'RUN'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'RESOLVE'
  | 'EXPORT';

export interface RecordAuditEventInput {
  moduleKey: string;
  entityType: string;
  entityId?: string;
  action: AuditEventAction;
  summary: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  diff?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actorId?: string;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  module_key: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  correlation_id: string | null;
  summary: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  diff: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditEventsQuery {
  moduleKey: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function useAuditEvents() {
  const recordEvent = useCallback(async (input: RecordAuditEventInput) => {
    try {
      const { error } = await supabase.from('audit_events').insert({
        tenant_id: TENANT_ID,
        module_key: input.moduleKey,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        action: input.action,
        actor_id: input.actorId ?? null,
        correlation_id: correlationContext.get(),
        summary: input.summary,
        before_state: (input.beforeState ?? null) as any,
        after_state: (input.afterState ?? null) as any,
        diff: (input.diff ?? null) as any,
        metadata: (input.metadata ?? {}) as any,
      });

      if (error) {
        console.error('Failed to record audit event:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error recording audit event:', err);
      return false;
    }
  }, []);

  const queryEvents = useCallback(async (params: AuditEventsQuery): Promise<{ data: AuditEvent[]; count: number }> => {
    try {
      let query = supabase
        .from('audit_events')
        .select('*', { count: 'exact' })
        .eq('tenant_id', TENANT_ID)
        .eq('module_key', params.moduleKey)
        .order('created_at', { ascending: false });

      if (params.entityType) query = query.eq('entity_type', params.entityType);
      if (params.entityId) query = query.eq('entity_id', params.entityId);
      if (params.action) query = query.eq('action', params.action);
      if (params.from) query = query.gte('created_at', params.from);
      if (params.to) query = query.lte('created_at', params.to);
      if (params.q) query = query.ilike('summary', `%${params.q}%`);

      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Failed to query audit events:', error);
        return { data: [], count: 0 };
      }

      return { data: (data as AuditEvent[]) ?? [], count: count ?? 0 };
    } catch (err) {
      console.error('Error querying audit events:', err);
      return { data: [], count: 0 };
    }
  }, []);

  const getEventDetail = useCallback(async (id: string): Promise<AuditEvent | null> => {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as AuditEvent;
    } catch {
      return null;
    }
  }, []);

  return { recordEvent, queryEvents, getEventDetail };
}

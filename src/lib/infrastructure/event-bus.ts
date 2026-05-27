/**
 * Domain Event Bus — Pub/Sub for internal domain events
 * Decouples modules: producers emit events, consumers subscribe.
 * Events are persisted to domain_events table for replay & audit.
 */

import { supabase } from '@/integrations/supabase/client';
import { correlationContext } from '@/lib/infrastructure/correlation';

// ── Domain Registry ──
export const DOMAINS = {
  AUTH: 'auth',
  RECONCILIATIONS: 'reconciliations',
  EXCEPTIONS: 'exceptions',
  AMENDMENTS: 'amendments',
  CONNECTORS: 'connectors',
  T2C: 't2c',
  RULES: 'rules',
  ANALYTICS: 'analytics',
  LOGISTICS: 'logistics',
  CASHFLOWS: 'cashflows',
  PLATFORM: 'platform',
} as const;

export type Domain = (typeof DOMAINS)[keyof typeof DOMAINS];

// ── Event Type Registry ──
export const EVENT_TYPES = {
  // Reconciliation events
  'reconciliation.run.started': DOMAINS.RECONCILIATIONS,
  'reconciliation.run.completed': DOMAINS.RECONCILIATIONS,
  'reconciliation.run.failed': DOMAINS.RECONCILIATIONS,
  // Exception events
  'exception.created': DOMAINS.EXCEPTIONS,
  'exception.assigned': DOMAINS.EXCEPTIONS,
  'exception.resolved': DOMAINS.EXCEPTIONS,
  'exception.escalated': DOMAINS.EXCEPTIONS,
  // Amendment events
  'amendment.created': DOMAINS.AMENDMENTS,
  'amendment.approved': DOMAINS.AMENDMENTS,
  'amendment.executed': DOMAINS.AMENDMENTS,
  // T2C events
  'posting.queued': DOMAINS.T2C,
  'posting.completed': DOMAINS.T2C,
  'posting.failed': DOMAINS.T2C,
  // Connector events
  'connector.sync.started': DOMAINS.CONNECTORS,
  'connector.sync.completed': DOMAINS.CONNECTORS,
  'connector.sync.failed': DOMAINS.CONNECTORS,
  // Logistics events
  'movement.created': DOMAINS.LOGISTICS,
  'movement.completed': DOMAINS.LOGISTICS,
  'nomination.confirmed': DOMAINS.LOGISTICS,
  'inventory.snapshot': DOMAINS.LOGISTICS,
  // Rules events
  'ruleset.activated': DOMAINS.RULES,
  'ruleset.simulation.completed': DOMAINS.RULES,
  // Analytics events
  'anomaly.detected': DOMAINS.ANALYTICS,
  'alert.triggered': DOMAINS.ANALYTICS,
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export interface DomainEvent<T = Record<string, unknown>> {
  id?: string;
  tenant_id: string;
  correlation_id?: string;
  event_type: EventType;
  domain: Domain;
  payload: T;
  metadata?: Record<string, unknown>;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

// ── In-memory subscriber registry ──
const subscribers = new Map<string, Set<EventHandler>>();

/**
 * Publish a domain event — persists to DB and notifies in-memory subscribers.
 */
export async function publishEvent<T = Record<string, unknown>>(
  event: Omit<DomainEvent<T>, 'domain'> & { domain?: Domain }
): Promise<string | null> {
  const domain = event.domain ?? EVENT_TYPES[event.event_type];
  const correlationId = event.correlation_id ?? correlationContext.get();

  // Persist to DB
  const { data, error } = await supabase
    .from('domain_events')
    .insert([{
      tenant_id: event.tenant_id,
      correlation_id: correlationId,
      event_type: event.event_type,
      domain,
      payload: (event.payload ?? {}) as unknown as import('@/integrations/supabase/types').Json,
      metadata: (event.metadata ?? {}) as unknown as import('@/integrations/supabase/types').Json,
      status: 'pending' as const,
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[EventBus] Failed to persist event:', error);
    return null;
  }

  // Notify in-memory subscribers
  const fullEvent: DomainEvent<T> = {
    ...event,
    id: data.id,
    domain,
    correlation_id: correlationId,
  };

  const handlers = subscribers.get(event.event_type);
  if (handlers) {
    for (const handler of handlers) {
      try {
        await handler(fullEvent as DomainEvent);
      } catch (err) {
        console.error(`[EventBus] Handler error for ${event.event_type}:`, err);
      }
    }
  }

  return data.id;
}

/**
 * Subscribe to a domain event type.
 * Returns an unsubscribe function.
 */
export function subscribeToEvent(eventType: EventType, handler: EventHandler): () => void {
  if (!subscribers.has(eventType)) {
    subscribers.set(eventType, new Set());
  }
  subscribers.get(eventType)!.add(handler);

  return () => {
    subscribers.get(eventType)?.delete(handler);
  };
}

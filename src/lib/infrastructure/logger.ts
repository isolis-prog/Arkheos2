/**
 * Structured Logger — Domain-scoped logging with correlation IDs.
 * Logs to console in dev, persists critical logs to structured_logs table.
 */

import { supabase } from '@/integrations/supabase/client';
import { correlationContext } from './correlation';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  domain: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  duration_ms?: number;
  tenant_id?: string;
  user_id?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Only persist warn+ to DB to avoid noise
const PERSIST_THRESHOLD: LogLevel = 'warn';

class StructuredLogger {
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log({ domain: this.domain, level: 'debug', message, context });
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log({ domain: this.domain, level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log({ domain: this.domain, level: 'warn', message, context });
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log({ domain: this.domain, level: 'error', message, context });
  }

  /** Time an async operation and log its duration */
  async timed<T>(
    message: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration_ms = Math.round(performance.now() - start);
      this.log({ domain: this.domain, level: 'info', message: `${message} [completed]`, context: { ...context, duration_ms }, duration_ms });
      return result;
    } catch (err) {
      const duration_ms = Math.round(performance.now() - start);
      this.log({ domain: this.domain, level: 'error', message: `${message} [failed]`, context: { ...context, duration_ms, error: String(err) }, duration_ms });
      throw err;
    }
  }

  private log(entry: LogEntry) {
    const correlationId = correlationContext.get();
    const formatted = {
      ...entry,
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
    };

    // Console output
    const consoleFn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
    consoleFn(`[${entry.domain}] [${correlationId.slice(0, 8)}] ${entry.message}`, entry.context ?? '');

    // Persist to DB if threshold met
    if (LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[PERSIST_THRESHOLD]) {
      this.persist(formatted).catch(() => {});
    }
  }

  private async persist(entry: LogEntry & { correlation_id: string }) {
    await supabase.from('structured_logs').insert([{
      tenant_id: entry.tenant_id ?? null,
      correlation_id: entry.correlation_id,
      domain: entry.domain,
      level: entry.level,
      message: entry.message,
      context: (entry.context ?? {}) as unknown as import('@/integrations/supabase/types').Json,
      duration_ms: entry.duration_ms ?? null,
      user_id: entry.user_id ?? null,
    }]);
  }
}

/** Create a domain-scoped logger */
export function createLogger(domain: string): StructuredLogger {
  return new StructuredLogger(domain);
}

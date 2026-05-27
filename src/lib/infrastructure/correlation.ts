/**
 * Correlation Context — Thread-local-like correlation ID for tracing.
 * Every operation within a request/action shares the same correlation_id.
 */

let currentCorrelationId: string | null = null;

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const correlationContext = {
  /** Start a new correlation scope */
  start(id?: string): string {
    currentCorrelationId = id ?? generateId();
    return currentCorrelationId;
  },

  /** Get the current correlation ID (creates one if none exists) */
  get(): string {
    if (!currentCorrelationId) {
      currentCorrelationId = generateId();
    }
    return currentCorrelationId;
  },

  /** Clear the current correlation scope */
  clear(): void {
    currentCorrelationId = null;
  },

  /** Run a function within a correlation scope */
  async withCorrelation<T>(fn: () => T | Promise<T>, id?: string): Promise<T> {
    const prevId = currentCorrelationId;
    currentCorrelationId = id ?? generateId();
    try {
      return await fn();
    } finally {
      currentCorrelationId = prevId;
    }
  },
};

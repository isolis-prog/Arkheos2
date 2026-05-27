import { z } from 'zod';
import type { BreakHistoryEvent } from '@/components/drill';

export type BreakHistoryEventType = BreakHistoryEvent['type'];

/**
 * Runtime schema for BreakHistoryEvent. The `type` field is restricted to the
 * exact literal union — any other string is rejected at parse time.
 */
export const breakHistoryEventTypeSchema = z.enum(['comment', 'status_change']);

export const breakHistoryEventSchema = z.object({
  id: z.string().min(1),
  type: breakHistoryEventTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  createdAt: z.string().min(1),
  actor: z.string().optional(),
});

export const breakHistoryEventArraySchema = z.array(breakHistoryEventSchema);

function toBreakHistoryEvent(parsed: z.infer<typeof breakHistoryEventSchema>): BreakHistoryEvent {
  const event: BreakHistoryEvent = {
    id: parsed.id as string,
    type: parsed.type as BreakHistoryEventType,
    label: parsed.label as string,
    createdAt: parsed.createdAt as string,
  };
  if (parsed.description !== undefined) event.description = parsed.description;
  if (parsed.actor !== undefined) event.actor = parsed.actor;
  return event;
}

/**
 * Builds a single BreakHistoryEvent with the `type` field correctly inferred
 * as the literal union ('comment' | 'status_change'), avoiding manual `as const`
 * or `as BreakHistoryEvent` casts at call sites.
 */
export function makeBreakHistoryEvent<T extends BreakHistoryEventType>(
  event: Omit<BreakHistoryEvent, 'type'> & { type: T },
): BreakHistoryEvent {
  return event;
}

export interface BuildBreakHistoryOptions {
  sort?: 'asc' | 'desc' | 'none';
  /**
   * When 'throw', invalid entries cause the function to throw a ZodError.
   * When 'skip' (default), invalid entries are filtered out and a warning is
   * logged so a single malformed payload does not break the whole timeline.
   */
  onInvalid?: 'throw' | 'skip';
}

/**
 * Builds a BreakHistoryEvent[] from a heterogeneous list of partial inputs,
 * preserving literal `type` and sorting by createdAt DESC by default.
 *
 * Each entry is validated with zod so that any payload whose `type` is not
 * exactly 'comment' or 'status_change' is rejected at runtime.
 */
export function buildBreakHistory(
  events: ReadonlyArray<unknown>,
  options: BuildBreakHistoryOptions = {},
): BreakHistoryEvent[] {
  const { sort = 'desc', onInvalid = 'skip' } = options;

  const list: BreakHistoryEvent[] = [];

  if (onInvalid === 'throw') {
    breakHistoryEventArraySchema.parse(events).forEach((parsed) => {
      list.push(toBreakHistoryEvent(parsed));
    });
  } else {
    events.forEach((event, index) => {
      const result = breakHistoryEventSchema.safeParse(event);
      if (result.success) {
        list.push(toBreakHistoryEvent(result.data));
      } else if (typeof console !== 'undefined') {
        console.warn(
          `[buildBreakHistory] Skipping invalid history event at index ${index}:`,
          result.error.flatten().fieldErrors,
        );
      }
    });
  }

  if (sort !== 'none') {
    const direction = sort === 'asc' ? 1 : -1;
    list.sort(
      (left, right) =>
        direction * (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    );
  }

  return list;
}


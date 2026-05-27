import { describe, it, expectTypeOf } from 'vitest';
import type { BreakDetailView, BreakHistoryEvent } from '@/components/drill';
import type { useBreakDetail } from '@/hooks/useBreakDetail';
import { buildBreakHistory, makeBreakHistoryEvent } from '@/lib/drill/breakHistory';

type UseBreakDetailReturn = ReturnType<typeof useBreakDetail>;

describe('useBreakDetail · type-level guarantees', () => {
  it('exposes a BreakDetailView whose history is BreakHistoryEvent[]', () => {
    type DataField = UseBreakDetailReturn['data'];
    expectTypeOf<DataField>().toEqualTypeOf<BreakDetailView | undefined>();

    type HistoryField = NonNullable<DataField>['history'];
    expectTypeOf<HistoryField>().toEqualTypeOf<BreakHistoryEvent[] | undefined>();
  });

  it('restricts BreakHistoryEvent.type to the literal union exactly', () => {
    type EventType = BreakHistoryEvent['type'];

    // Exact union — no widening to string allowed.
    expectTypeOf<EventType>().toEqualTypeOf<'comment' | 'status_change'>();
    expectTypeOf<EventType>().not.toEqualTypeOf<string>();

    // Each literal individually assignable.
    expectTypeOf<'comment'>().toMatchTypeOf<EventType>();
    expectTypeOf<'status_change'>().toMatchTypeOf<EventType>();

    // Foreign literals are NOT assignable.
    // @ts-expect-error — 'amendment' is not part of BreakHistoryEvent.type
    const _bad: EventType = 'amendment';
    void _bad;
  });

  it('makeBreakHistoryEvent preserves the literal type at the call site', () => {
    const evt = makeBreakHistoryEvent({
      id: 'e1',
      type: 'comment',
      label: 'hi',
      createdAt: new Date().toISOString(),
    });

    expectTypeOf(evt).toEqualTypeOf<BreakHistoryEvent>();
    expectTypeOf(evt.type).toEqualTypeOf<'comment' | 'status_change'>();
  });

  it('buildBreakHistory returns BreakHistoryEvent[] with strict type union', () => {
    const list = buildBreakHistory([
      { id: '1', type: 'status_change', label: 'a', createdAt: '2024-01-01' },
      { id: '2', type: 'comment', label: 'b', createdAt: '2024-01-02' },
    ]);

    expectTypeOf(list).toEqualTypeOf<BreakHistoryEvent[]>();
    expectTypeOf(list[0].type).toEqualTypeOf<'comment' | 'status_change'>();

    // Runtime: invalid `type` literals are skipped (default onInvalid: 'skip')
    const filtered = buildBreakHistory([
      { id: 'x', type: 'foo', label: 'c', createdAt: '2024-01-03' },
      { id: 'y', type: 'comment', label: 'd', createdAt: '2024-01-04' },
    ]);
    if (filtered.length !== 1 || filtered[0].id !== 'y') {
      throw new Error('buildBreakHistory should reject invalid type literals at runtime');
    }
  });
});

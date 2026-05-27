import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PostgrestError } from '@supabase/supabase-js';

export interface DrillQueryState<TData> {
  data: TData;
  error: Error | PostgrestError | null;
  isEmpty: boolean;
  isLoading: boolean;
}

export function useDrillErrorToast(error: Error | PostgrestError | null | undefined, title: string) {
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const message = error?.message ?? null;

    if (!message) {
      lastErrorRef.current = null;
      return;
    }

    if (lastErrorRef.current === message) {
      return;
    }

    lastErrorRef.current = message;
    toast.error(title, {
      description: message,
    });
  }, [error, title]);
}

export function createDrillState<TData>(params: {
  data: TData;
  error: Error | PostgrestError | null;
  isEmpty: boolean;
  isLoading: boolean;
}): DrillQueryState<TData> {
  return params;
}

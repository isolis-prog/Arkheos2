import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDrillErrorToast } from './shared';

/**
 * Resolve the canonical `exception_case_id` for a given `(runId, docId)`
 * pair. The L6 document-trades page only carries `docId` in the URL, so
 * downstream actions (open BreakDetailPanel, close break, add comment,
 * audit) need this lookup to bind their work to the right exception case.
 *
 * Returns the most recent exception case for the document so multi-break
 * documents still surface the latest enrichment.
 */
export function useDocExceptionCaseId(runId: string, docId: string) {
  const query = useQuery({
    queryKey: ['recon', 'doc-exception-case-id', runId, docId],
    enabled: Boolean(runId && docId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('break_details')
        .select('exception_case_id')
        .eq('run_id', runId)
        .eq('doc_id', docId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.exception_case_id ?? null;
    },
  });

  useDrillErrorToast(query.error, 'Failed to resolve break case for document');

  return {
    exceptionCaseId: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

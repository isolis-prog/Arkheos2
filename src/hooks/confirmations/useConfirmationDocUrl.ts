import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DocUrlResponse {
  available: boolean;
  signedUrl?: string;
  reason?: string;
}

interface EdgeError {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function useConfirmationDocUrl() {
  return useMutation({
    mutationFn: async (confirmationDocId: string): Promise<DocUrlResponse> => {
      const { data, error } = await supabase.functions.invoke('get-confirmation-doc-url', {
        body: { confirmationDocId },
      });
      if (error) {
        // Try to surface the structured error returned by the edge function.
        const ctx = (error as { context?: { body?: string } }).context;
        let parsed: { error?: EdgeError } | null = null;
        try {
          parsed = ctx?.body ? JSON.parse(ctx.body) : null;
        } catch { /* ignore */ }
        const ed = parsed?.error;
        const message = ed?.message ?? error.message ?? 'Request failed';
        const code = ed?.code ? ` [${ed.code}]` : '';
        throw new Error(`${message}${code}`);
      }
      return data as DocUrlResponse;
    },
    onSuccess: (data) => {
      if (!data.available) {
        toast.info('No source file available', {
          description: data.reason ?? 'This confirmation has no stored document (demo data).',
        });
        return;
      }
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (e: Error) => toast.error('Could not load document', { description: e.message }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Exception, ExceptionStatus } from '@/lib/types';

const STORAGE_BUCKET = 'exception-attachments';

export interface ExceptionComment {
  id: string;
  exception_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
}

export interface ExceptionAttachment {
  id: string;
  exception_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ExceptionWithDetails extends Exception {
  match_group?: {
    id: string;
    match_key: string | null;
    match_type: string;
    side_a_total: number | null;
    side_b_total: number | null;
    delta: number | null;
    delta_pct: number | null;
  } | null;
  run?: {
    id: string;
    period_start: string | null;
    period_end: string | null;
    template?: {
      name: string;
      side_a_source: string;
      side_b_source: string;
    } | null;
  } | null;
  assigned_user?: {
    full_name: string | null;
    email: string;
  } | null;
  resolved_user?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'comment' | 'amendment' | 'attachment';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export function useExceptionDetails(exceptionId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch exception with related data
  const { data: exception, isLoading: isLoadingException } = useQuery({
    queryKey: ['exception', exceptionId],
    queryFn: async () => {
      if (!exceptionId) return null;
      
      const { data, error } = await supabase
        .from('exceptions')
        .select(`
          *,
          match_group:match_groups(
            id,
            match_key,
            match_type,
            side_a_total,
            side_b_total,
            delta,
            delta_pct
          ),
          run:reconciliation_runs(
            id,
            period_start,
            period_end,
            template:reconciliation_templates(
              name,
              side_a_source,
              side_b_source
            )
          ),
          assigned_user:profiles!exceptions_assigned_to_fkey(
            full_name,
            email
          ),
          resolved_user:profiles!exceptions_resolved_by_fkey(
            full_name,
            email
          )
        `)
        .eq('id', exceptionId)
        .single();

      if (error) throw error;
      return data as ExceptionWithDetails;
    },
    enabled: !!exceptionId,
  });

  // Fetch comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['exception-comments', exceptionId],
    queryFn: async () => {
      if (!exceptionId) return [];
      
      const { data, error } = await supabase
        .from('exception_comments')
        .select(`
          *,
          user:profiles!exception_comments_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('exception_id', exceptionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ExceptionComment[];
    },
    enabled: !!exceptionId,
  });

  // Fetch attachments
  const { data: attachments = [], isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['exception-attachments', exceptionId],
    queryFn: async () => {
      if (!exceptionId) return [];
      
      const { data, error } = await supabase
        .from('exception_attachments')
        .select('*')
        .eq('exception_id', exceptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExceptionAttachment[];
    },
    enabled: !!exceptionId,
  });

  // Fetch audit logs for timeline
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['exception-audit', exceptionId],
    queryFn: async () => {
      if (!exceptionId) return [];
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(
            full_name,
            email
          )
        `)
        .eq('entity_type', 'exception')
        .eq('entity_id', exceptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exceptionId,
  });

  // Build timeline from various sources
  const timeline: TimelineEvent[] = [
    // Add creation event
    ...(exception
      ? [
          {
            id: `created-${exception.id}`,
            type: 'status_change',
            title: 'Exception Created',
            description: `Break detected: ${exception.break_type.replace(/_/g, ' ')}`,
            timestamp: exception.created_at,
          } satisfies TimelineEvent,
        ]
      : []),
    // Add comments to timeline
    ...comments.map<TimelineEvent>((c) => ({
      id: `comment-${c.id}`,
      type: 'comment',
      title: 'Comment Added',
      description: c.comment,
      timestamp: c.created_at,
      actor: c.user?.full_name || c.user?.email,
    })),
    // Add audit log events
    ...auditLogs.map<TimelineEvent>((log: any) => ({
      id: `audit-${log.id}`,
      type: log.action.includes('assign') ? 'assignment' : 'status_change',
      title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: log.after_state?.description || '',
      timestamp: log.created_at,
      actor: log.actor?.full_name || log.actor?.email,
      metadata: log.after_state,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      if (!exceptionId) throw new Error('No exception ID');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('exception_comments')
        .insert({
          exception_id: exceptionId,
          user_id: user.id,
          comment,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exception-comments', exceptionId] });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ status, reasonCode, reasonDetails }: { 
      status: ExceptionStatus; 
      reasonCode?: string;
      reasonDetails?: string;
    }) => {
      if (!exceptionId) throw new Error('No exception ID');

      const updates: Record<string, unknown> = { status };
      
      if (status === 'resolved' || status === 'closed') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.resolved_by = user?.id;
        updates.resolved_at = new Date().toISOString();
      }
      
      if (reasonCode) updates.reason_code = reasonCode;
      if (reasonDetails) updates.reason_details = reasonDetails;

      const { error } = await supabase
        .from('exceptions')
        .update(updates)
        .eq('id', exceptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exception', exceptionId] });
      toast.success('Status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Assign user mutation
  const assignUser = useMutation({
    mutationFn: async (userId: string | null) => {
      if (!exceptionId) throw new Error('No exception ID');

      const { error } = await supabase
        .from('exceptions')
        .update({ 
          assigned_to: userId,
          status: userId ? 'in_progress' : 'open',
        })
        .eq('id', exceptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exception', exceptionId] });
      toast.success('Assignment updated');
    },
    onError: (error) => {
      toast.error(`Failed to assign user: ${error.message}`);
    },
  });

  // Upload attachment mutation
  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!exceptionId) throw new Error('No exception ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const filePath = `${exceptionId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { error: dbError } = await supabase
        .from('exception_attachments')
        .insert({
          exception_id: exceptionId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (dbError) {
        // Rollback storage upload on DB error
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exception-attachments', exceptionId] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to upload: ${error.message}`);
    },
  });

  // Delete attachment mutation
  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      // Get the attachment record first
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) throw new Error('Attachment not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('exception_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exception-attachments', exceptionId] });
      toast.success('Attachment deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return {
    exception,
    comments,
    attachments,
    timeline,
    isLoading: isLoadingException || isLoadingComments || isLoadingAttachments,
    addComment,
    updateStatus,
    assignUser,
    uploadAttachment,
    deleteAttachment,
  };
}

// Hook to fetch team members for assignment
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

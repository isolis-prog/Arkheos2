import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bot, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface AgentNotificationOptions {
  runId?: string;
  enabled?: boolean;
}

export function useAgentNotifications({ runId, enabled = true }: AgentNotificationOptions = {}) {
  const queryClient = useQueryClient();
  const lastEventTimestamp = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to exception_cases changes (agent proposals)
    const exceptionChannel = supabase
      .channel(`agent_exceptions:${runId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exception_cases',
          ...(runId ? { filter: `run_id=eq.${runId}` } : {}),
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check if status changed to 'proposed' (AI proposed a match)
          if (oldData?.status !== 'proposed' && newData?.status === 'proposed') {
            toast.success('AI Agent Proposed Match', {
              description: newData.summary || 'The agent has proposed a resolution for an exception.',
              icon: '🤖',
              duration: 5000,
            });
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['recon-exceptions', runId] });
          }
          
          // Check if recommended_actions were updated (analysis complete)
          if (newData?.recommended_actions?.length > (oldData?.recommended_actions?.length || 0)) {
            toast.info('AI Analysis Complete', {
              description: 'The agent has completed analysis and provided recommendations.',
              icon: '🔍',
              duration: 4000,
            });
            
            queryClient.invalidateQueries({ queryKey: ['recon-exceptions', runId] });
          }
        }
      )
      .subscribe();

    // Subscribe to match_decisions changes
    const decisionsChannel = supabase
      .channel(`agent_decisions:${runId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_decisions',
        },
        (payload) => {
          const newData = payload.new as any;
          
          if (newData?.decided_by_agent) {
            const statusMessages: Record<string, { title: string; desc: string; icon: string }> = {
              proposed: { 
                title: 'AI Match Proposal', 
                desc: 'Agent proposed a new match candidate',
                icon: '🎯'
              },
              auto: { 
                title: 'Auto-Match Created', 
                desc: 'High-confidence match was automatically approved',
                icon: '⚡'
              },
            };
            
            const msg = statusMessages[newData.decision_status] || {
              title: 'Match Decision',
              desc: 'A new match decision was recorded',
              icon: '📋'
            };
            
            toast.success(msg.title, {
              description: msg.desc,
              icon: msg.icon,
              duration: 4000,
            });
            
            queryClient.invalidateQueries({ queryKey: ['recon-candidates', runId] });
          }
        }
      )
      .subscribe();

    // Subscribe to agent_audit_events for real-time agent activity
    const auditChannel = supabase
      .channel(`agent_audit:${runId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_audit_events',
          ...(runId ? { filter: `run_id=eq.${runId}` } : {}),
        },
        (payload) => {
          const event = payload.new as any;
          
          // Only show notifications for agent actions
          if (event?.actor_type === 'agent') {
            const actionNotifications: Record<string, { title: string; variant: 'success' | 'info' | 'warning' }> = {
              analyze_exception: { title: 'Exception Analyzed', variant: 'info' },
              propose_match: { title: 'Match Proposed', variant: 'success' },
              reject_candidate: { title: 'Candidate Rejected', variant: 'warning' },
              auto_triage: { title: 'Queue Triaged', variant: 'info' },
              close_exception: { title: 'Exception Closed', variant: 'success' },
            };
            
            const notification = actionNotifications[event.action];
            if (notification) {
              const toastFn = notification.variant === 'success' ? toast.success 
                : notification.variant === 'warning' ? toast.warning 
                : toast.info;
              
              toastFn(`AI Agent: ${notification.title}`, {
                description: event.tool_name ? `Tool: ${event.tool_name}` : undefined,
                icon: '🤖',
                duration: 3000,
              });
            }
            
            queryClient.invalidateQueries({ queryKey: ['agent-audit-events', runId] });
          }
        }
      )
      .subscribe();

    // Subscribe to recon_runs status changes
    const runsChannel = supabase
      .channel(`recon_runs_status:${runId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'recon_runs',
          ...(runId ? { filter: `id=eq.${runId}` } : {}),
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          if (oldData?.status !== newData?.status) {
            const statusMessages: Record<string, { title: string; desc: string; variant: 'success' | 'info' | 'error' }> = {
              running: { title: 'Matching Started', desc: 'The reconciliation engine is processing records', variant: 'info' },
              completed: { title: 'Matching Complete', desc: `Processed ${newData.metrics?.records_a || 0} records`, variant: 'success' },
              failed: { title: 'Matching Failed', desc: 'An error occurred during processing', variant: 'error' },
            };
            
            const msg = statusMessages[newData.status];
            if (msg) {
              const toastFn = msg.variant === 'success' ? toast.success 
                : msg.variant === 'error' ? toast.error 
                : toast.info;
              
              toastFn(msg.title, {
                description: msg.desc,
                duration: 5000,
              });
            }
            
            queryClient.invalidateQueries({ queryKey: ['recon-runs'] });
            queryClient.invalidateQueries({ queryKey: ['recon-run', runId] });
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(exceptionChannel);
      supabase.removeChannel(decisionsChannel);
      supabase.removeChannel(auditChannel);
      supabase.removeChannel(runsChannel);
    };
  }, [runId, enabled, queryClient]);
}

// Standalone notification functions for manual triggers
export const notifyAgentAction = (action: string, details?: string) => {
  toast.info(`AI Agent: ${action}`, {
    description: details,
    icon: '🤖',
    duration: 3000,
  });
};

export const notifyMatchProposed = (confidence: number) => {
  toast.success('Match Proposed', {
    description: `AI Agent proposed a match with ${(confidence * 100).toFixed(0)}% confidence`,
    icon: '🎯',
    duration: 4000,
  });
};

export const notifyAnalysisComplete = (exceptionsAnalyzed: number) => {
  toast.success('Analysis Complete', {
    description: `Analyzed ${exceptionsAnalyzed} exception${exceptionsAnalyzed !== 1 ? 's' : ''}`,
    icon: '🔍',
    duration: 4000,
  });
};

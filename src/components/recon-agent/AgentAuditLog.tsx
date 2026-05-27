import { useQuery } from '@tanstack/react-query';
import { FileText, User, Bot, Settings, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';

interface AgentAuditLogProps {
  runId: string;
}

const actorIcons: Record<string, any> = {
  user: User,
  agent: Bot,
  system: Settings,
};

const actionColors: Record<string, string> = {
  run_matching: 'bg-primary/10 text-primary',
  analyze_exception: 'bg-purple-500/10 text-purple-500',
  propose_match: 'bg-accent/10 text-accent',
  approve_proposal: 'bg-green-500/10 text-green-500',
  reject_candidate: 'bg-destructive/10 text-destructive',
  close_exception: 'bg-muted text-muted-foreground',
  auto_triage: 'bg-warning/10 text-warning',
};

export function AgentAuditLog({ runId }: AgentAuditLogProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['agent-audit', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_audit_events')
        .select('*')
        .eq('run_id', runId)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Trail
          <Badge variant="secondary">{events?.length || 0} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : events?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit events for this run
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {events?.map((event) => {
              const ActorIcon = actorIcons[event.actor_type] || Settings;
              return (
                <div 
                  key={event.id} 
                  className="rounded-lg border p-3 flex items-start gap-3"
                >
                  <div className={`p-2 rounded-full ${
                    event.actor_type === 'agent' ? 'bg-primary/10' : 
                    event.actor_type === 'user' ? 'bg-accent/10' : 'bg-muted'
                  }`}>
                    <ActorIcon className={`h-4 w-4 ${
                      event.actor_type === 'agent' ? 'text-primary' : 
                      event.actor_type === 'user' ? 'text-accent' : 'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary" 
                        className={actionColors[event.action] || 'bg-muted'}
                      >
                        {event.action?.replace(/_/g, ' ')}
                      </Badge>
                      {event.tool_name && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {event.tool_name}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm">
                      <span className="capitalize">{event.actor_type}</span>
                      {' performed action on '}
                      <span className="font-medium">{event.entity_type}</span>
                      {event.entity_id && (
                        <span className="font-mono text-xs text-muted-foreground ml-1">
                          ({event.entity_id.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                    
                    {/* Output summary if available */}
                    {event.output_json && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {typeof event.output_json === 'object' && 
                          Object.entries(event.output_json as Record<string, any>)
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                            .join(' | ')
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                    <div className="font-mono mt-1" title="Input hash">
                      #{event.hash_input?.slice(0, 6) || '------'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

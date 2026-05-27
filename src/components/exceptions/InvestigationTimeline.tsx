import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  UserCheck, 
  RefreshCw, 
  FileEdit, 
  Paperclip,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/hooks/useExceptionDetails';

interface InvestigationTimelineProps {
  events: TimelineEvent[];
}

const eventIcons: Record<TimelineEvent['type'], React.ElementType> = {
  status_change: RefreshCw,
  assignment: UserCheck,
  comment: MessageSquare,
  amendment: FileEdit,
  attachment: Paperclip,
};

const eventColors: Record<TimelineEvent['type'], string> = {
  status_change: 'bg-blue-500',
  assignment: 'bg-purple-500',
  comment: 'bg-emerald-500',
  amendment: 'bg-amber-500',
  attachment: 'bg-slate-500',
};

export function InvestigationTimeline({ events }: InvestigationTimelineProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) {
        const minutes = Math.floor(diff / 60000);
        return minutes < 1 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    return date.toLocaleDateString();
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Investigation Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No timeline events yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Investigation Timeline
          <span className="text-muted-foreground font-normal">({events.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type] || RefreshCw;
              const bgColor = eventColors[event.type] || 'bg-slate-500';

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white",
                    bgColor
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(event.timestamp)}
                      </time>
                    </div>
                    
                    {event.actor && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {event.actor}
                      </p>
                    )}
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { History, Search, ChevronLeft, ChevronRight, Clock, User, FileText, Eye } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuditEvents, type AuditEvent, type AuditEventsQuery } from '@/hooks/useAuditEvents';
import { AuditEventDetailPanel } from './AuditEventDetailPanel';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SOFT_DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  RUN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  REJECT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  ASSIGN: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  RESOLVE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  EXPORT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface ModuleHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKey: string;
  moduleLabel?: string;
  entityTypes?: string[];
}

const PAGE_SIZE = 30;

export function ModuleHistoryDrawer({
  open,
  onOpenChange,
  moduleKey,
  moduleLabel,
  entityTypes = [],
}: ModuleHistoryDrawerProps) {
  const { queryEvents } = useAuditEvents();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params: AuditEventsQuery = {
      moduleKey,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (actionFilter !== 'all') params.action = actionFilter;
    if (entityTypeFilter !== 'all') params.entityType = entityTypeFilter;

    const result = await queryEvents(params);
    setEvents(result.data);
    setTotalCount(result.count);
    setLoading(false);
  }, [moduleKey, page, searchQuery, actionFilter, entityTypeFilter, queryEvents]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    }
  }, [open, fetchEvents]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, actionFilter, entityTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (selectedEvent) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl" side="right">
          <SheetHeader>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSelectedEvent(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to list
            </Button>
            <SheetTitle>Event Detail</SheetTitle>
          </SheetHeader>
          <AuditEventDetailPanel event={selectedEvent} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl" side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {moduleLabel ?? moduleKey} History
          </SheetTitle>
          <SheetDescription>Audit trail of all changes and actions</SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="RUN">Run</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="RESOLVE">Resolve</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>
            {entityTypes.length > 0 && (
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map((et) => (
                    <SelectItem key={et} value={et}>{et}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Event List */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="mb-2 h-8 w-8" />
              <p>No history events found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event) => (
                <button
                  key={event.id}
                  className="w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/50"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ACTION_COLORS[event.action] ?? 'bg-secondary text-secondary-foreground'}`}>
                          {event.action}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{event.entity_type}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm">{event.summary ?? '—'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.created_at), 'MMM d, HH:mm')}
                      </span>
                      {(event.before_state || event.after_state || event.diff) && (
                        <span className="flex items-center gap-1 text-primary">
                          <Eye className="h-3 w-3" /> diff
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalCount} events</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{page + 1} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

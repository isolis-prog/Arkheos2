import { useState } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  Bot, 
  CheckCircle2, 
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExceptionCase } from '@/hooks/useReconAgent';
import { ExceptionDetailPanel } from './ExceptionDetailPanel';

interface ExceptionsQueueProps {
  runId: string;
  exceptions: ExceptionCase[];
  onRefresh: () => void;
}

const severityColors: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground',
};

const statusColors: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive border-destructive/20',
  in_review: 'bg-warning/10 text-warning border-warning/20',
  proposed: 'bg-primary/10 text-primary border-primary/20',
  approved: 'bg-accent/10 text-accent border-accent/20',
  closed: 'bg-muted text-muted-foreground border-muted',
};

const typeLabels: Record<string, string> = {
  unmatched: 'Unmatched',
  amount_mismatch: 'Amount Mismatch',
  date_mismatch: 'Date Mismatch',
  duplicate: 'Duplicate',
  needs_review: 'Needs Review',
  one_to_many: '1:Many',
};

export function ExceptionsQueue({ runId, exceptions, onRefresh }: ExceptionsQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExceptions = exceptions.filter(exc => {
    if (statusFilter !== 'all' && exc.status !== statusFilter) return false;
    if (typeFilter !== 'all' && exc.exception_type !== typeFilter) return false;
    if (severityFilter !== 'all' && exc.severity !== severityFilter) return false;
    return true;
  });

  const selectedException = selectedExceptionId 
    ? exceptions.find(e => e.id === selectedExceptionId) 
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Queue List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Exception Queue</CardTitle>
            <span className="text-sm text-muted-foreground">
              {filteredExceptions.length} of {exceptions.length}
            </span>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 pt-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                <SelectItem value="date_mismatch">Date Mismatch</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
          {filteredExceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-accent" />
              <p>No exceptions match the current filters</p>
            </div>
          ) : (
            filteredExceptions.map((exc) => (
              <div
                key={exc.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedExceptionId === exc.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedExceptionId(exc.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={severityColors[exc.severity]} variant="secondary">
                        {exc.severity}
                      </Badge>
                      <Badge variant="outline" className={statusColors[exc.status]}>
                        {exc.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate">
                      {typeLabels[exc.exception_type] || exc.exception_type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {exc.summary || 'No summary'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {exc.recommended_actions?.length > 0 && (
                      <span title="AI recommendations available">
                        <Bot className="h-4 w-4 text-primary" />
                      </span>
                    )}
                    <Button
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === exc.id ? null : exc.id);
                      }}
                    >
                      {expandedId === exc.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Expanded preview */}
                {expandedId === exc.id && exc.evidence && (
                  <div className="mt-2 pt-2 border-t text-xs space-y-1">
                    {exc.evidence.record_a && (
                      <div>
                        <span className="text-muted-foreground">ID: </span>
                        <span className="font-mono">{exc.evidence.record_a.external_id}</span>
                        <span className="text-muted-foreground"> | Amount: </span>
                        <span>${Number(exc.evidence.record_a.amount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {exc.evidence.top_candidates?.length > 0 && (
                      <div className="text-muted-foreground">
                        {exc.evidence.top_candidates.length} candidate(s) found, 
                        top score: {(exc.evidence.top_candidates[0].scoreTotal * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <ExceptionDetailPanel
        exception={selectedException}
        runId={runId}
        onRefresh={onRefresh}
        onClose={() => setSelectedExceptionId(null)}
      />
    </div>
  );
}

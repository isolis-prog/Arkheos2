import { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExceptionCase, useAgentTools } from '@/hooks/useReconAgent';
import { useToast } from '@/hooks/use-toast';
import { notifyAnalysisComplete, notifyMatchProposed } from '@/hooks/useAgentNotifications';

interface ExceptionDetailPanelProps {
  exception: ExceptionCase | null;
  runId: string;
  onRefresh: () => void;
  onClose: () => void;
}

const resolutionCodes = [
  { value: 'matched_manually', label: 'Matched Manually' },
  { value: 'timing_difference', label: 'Timing Difference' },
  { value: 'system_error', label: 'System Error' },
  { value: 'duplicate_entry', label: 'Duplicate Entry' },
  { value: 'no_action_required', label: 'No Action Required' },
  { value: 'escalated', label: 'Escalated' },
];

export function ExceptionDetailPanel({ exception, runId, onRefresh, onClose }: ExceptionDetailPanelProps) {
  const { toast } = useToast();
  const { analyzeException, proposeMatch, closeException, isLoading } = useAgentTools();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleAnalyze = async () => {
    if (!exception) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeException(exception.id);
      setAiAnalysis(analysis);
      notifyAnalysisComplete(1);
      toast({ title: 'Analysis complete', description: 'AI has analyzed the exception' });
    } catch (error) {
      toast({ title: 'Analysis failed', description: 'Could not analyze exception', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!exception || !aiAnalysis?.recommended_action) return;
    const action = aiAnalysis.recommended_action;
    
    if (action.type === 'accept_match' && action.candidate_id) {
      const confidence = aiAnalysis.confidence || 0.8;
      await proposeMatch(
        exception.id, 
        action.candidate_id, 
        action.rationale || 'Accepted AI suggestion',
        confidence
      );
      notifyMatchProposed(confidence);
      toast({ title: 'Match proposed', description: 'Awaiting approval' });
      onRefresh();
    }
  };

  const handleClose = async () => {
    if (!exception || !resolutionCode) return;
    await closeException(exception.id, resolutionCode, resolutionNotes);
    toast({ title: 'Exception closed', description: `Resolved as: ${resolutionCode}` });
    setResolutionCode('');
    setResolutionNotes('');
    onRefresh();
  };

  if (!exception) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Select an exception to view details</p>
        </div>
      </Card>
    );
  }

  const evidence = exception.evidence || {};
  const recordA = evidence.record_a;
  const topCandidates = evidence.top_candidates || [];

  return (
    <Card className="h-[600px] overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Exception Details</CardTitle>
            <CardDescription className="font-mono text-xs">
              {exception.id.slice(0, 8)}...
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            Analyze with AI
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pt-4">
        {/* Source Record */}
        {recordA && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Source A Record</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">ID: </span>
                <span className="font-mono">{recordA.external_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span>{recordA.record_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount: </span>
                <span className="font-medium">${Number(recordA.amount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Counterparty: </span>
                <span>{recordA.counterparty || 'N/A'}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {recordA.description}
            </div>
          </div>
        )}

        {/* Top Candidates */}
        {topCandidates.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Top Candidates (Source B)</div>
            {topCandidates.slice(0, 3).map((candidate: any, idx: number) => (
              <div key={idx} className="rounded-lg border p-2 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs">
                    {candidate.rightRecordId?.slice(0, 8) || `Candidate ${idx + 1}`}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {(candidate.scoreTotal * 100).toFixed(1)}% match
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Amount Δ: ${Math.abs(candidate.amountDelta || 0).toLocaleString()}</span>
                  <span>Date Δ: {candidate.dateDelta || 0} days</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(candidate.reasonCodes || []).slice(0, 3).map((code: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-primary" />
              AI Analysis
              <Badge variant="secondary">{(aiAnalysis.confidence * 100).toFixed(0)}% confident</Badge>
            </div>
            
            {/* Summary */}
            {aiAnalysis.summary && (
              <ul className="text-sm space-y-1">
                {aiAnalysis.summary.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-1 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Recommendation */}
            {aiAnalysis.recommended_action && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Recommended Action</div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {aiAnalysis.recommended_action.type?.replace('_', ' ')}
                  </Badge>
                  {aiAnalysis.recommended_action.type === 'accept_match' && (
                    <Button size="sm" onClick={handleAcceptSuggestion} disabled={isLoading}>
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                  )}
                </div>
                {aiAnalysis.recommended_action.rationale && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiAnalysis.recommended_action.rationale}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resolution Form */}
        <div className="rounded-lg border p-3 space-y-3">
          <div className="text-sm font-medium">Close Exception</div>
          
          <Select value={resolutionCode} onValueChange={setResolutionCode}>
            <SelectTrigger>
              <SelectValue placeholder="Select resolution code" />
            </SelectTrigger>
            <SelectContent>
              {resolutionCodes.map((code) => (
                <SelectItem key={code.value} value={code.value}>
                  {code.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Resolution notes (optional)"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="h-20"
          />

          <Button 
            className="w-full" 
            onClick={handleClose} 
            disabled={!resolutionCode || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Close Exception
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

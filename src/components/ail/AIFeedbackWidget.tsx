/**
 * AIL Feedback Widget — Reusable component displayed below every AI suggestion.
 * Provides: [✓ Helpful] [✗ Not Helpful] [✎ Correct it] actions.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Pencil, Sparkles } from 'lucide-react';
import { useAILFeedback } from '@/hooks/useAIL';
import type { AILWorkflowType, AILFeedbackType } from '@/lib/ail/types';

interface AIFeedbackWidgetProps {
  resultId: string;
  workflowType: AILWorkflowType;
  entityId: string;
  entityType: string;
  originalSuggestion?: Record<string, unknown>;
  displayedAt?: string;
  tenantId?: string;
}

const REJECTION_REASONS = [
  'Wrong cause',
  'Wrong action',
  'Not relevant',
  'Already knew this',
  'Other',
];

export const AIFeedbackWidget = ({
  resultId,
  workflowType,
  entityId,
  entityType,
  originalSuggestion,
  displayedAt,
  tenantId,
}: AIFeedbackWidgetProps) => {
  const { submitFeedback } = useAILFeedback();
  const [submitted, setSubmitted] = useState<AILFeedbackType | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [correctionText, setCorrectionText] = useState('');

  if (submitted && !showRejectReason && !showCorrection) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 py-1">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>
          {submitted === 'ACCEPTED' && 'Thanks — this improves future suggestions'}
          {submitted === 'REJECTED' && 'Feedback recorded'}
          {submitted === 'MODIFIED' && 'Correction saved'}
        </span>
      </div>
    );
  }

  const handleAccept = async () => {
    await submitFeedback({
      result_id: resultId,
      tenant_id: tenantId,
      workflow_type: workflowType,
      entity_id: entityId,
      entity_type: entityType,
      feedback_type: 'ACCEPTED',
      original_suggestion: originalSuggestion,
      displayed_at: displayedAt,
    });
    setSubmitted('ACCEPTED');
  };

  const handleReject = () => {
    setShowRejectReason(true);
  };

  const confirmReject = async () => {
    await submitFeedback({
      result_id: resultId,
      tenant_id: tenantId,
      workflow_type: workflowType,
      entity_id: entityId,
      entity_type: entityType,
      feedback_type: 'REJECTED',
      feedback_reason: rejectReason,
      original_suggestion: originalSuggestion,
      displayed_at: displayedAt,
    });
    setShowRejectReason(false);
    setSubmitted('REJECTED');
  };

  const handleCorrect = () => {
    setShowCorrection(true);
  };

  const confirmCorrection = async () => {
    await submitFeedback({
      result_id: resultId,
      tenant_id: tenantId,
      workflow_type: workflowType,
      entity_id: entityId,
      entity_type: entityType,
      feedback_type: 'MODIFIED',
      user_correction: { correction: correctionText },
      original_suggestion: originalSuggestion,
      displayed_at: displayedAt,
    });
    setShowCorrection(false);
    setSubmitted('MODIFIED');
  };

  return (
    <div className="mt-3 space-y-2">
      {!showRejectReason && !showCorrection && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary hover:text-primary/80 hover:bg-primary/10"
            onClick={handleAccept}
          >
            <Check className="h-3 w-3" />
            Helpful
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={handleReject}
          >
            <X className="h-3 w-3" />
            Not Helpful
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleCorrect}
          >
            <Pencil className="h-3 w-3" />
            Correct it
          </Button>
        </div>
      )}

      {showRejectReason && (
        <div className="space-y-2 border rounded-md p-3 bg-muted/30">
          <p className="text-xs font-medium">Why wasn't this helpful?</p>
          <Select value={rejectReason} onValueChange={setRejectReason}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select reason..." />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={confirmReject} disabled={!rejectReason}>
              Submit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowRejectReason(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showCorrection && (
        <div className="space-y-2 border rounded-md p-3 bg-muted/30">
          <p className="text-xs font-medium">What should the correct analysis be?</p>
          <Textarea
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            placeholder="Describe what you would change..."
            className="text-xs min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={confirmCorrection} disabled={!correctionText}>
              Submit Correction
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCorrection(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── AI Suggestion Card wrapper ──
interface AISuggestionCardProps {
  title?: string;
  children: React.ReactNode;
  resultId: string;
  workflowType: AILWorkflowType;
  entityId: string;
  entityType: string;
  confidenceScore?: number;
  originalSuggestion?: Record<string, unknown>;
  isLoading?: boolean;
  error?: string | null;
}

export const AISuggestionCard = ({
  title = 'AI Analysis',
  children,
  resultId,
  workflowType,
  entityId,
  entityType,
  confidenceScore,
  originalSuggestion,
  isLoading,
  error,
}: AISuggestionCardProps) => {
  const displayedAt = useState(() => new Date().toISOString())[0];

  if (error) {
    return (
      <div className="border border-dashed rounded-lg p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          AI analysis temporarily unavailable. Retry in a few minutes.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm font-medium">Analyzing with ArkheOS AI...</span>
        </div>
      </div>
    );
  }

  if (!resultId) return null;

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            AI Suggestion — Review before acting
          </Badge>
        </div>
        {confidenceScore != null && (
          <Badge
            variant={confidenceScore >= 0.8 ? 'default' : confidenceScore >= 0.6 ? 'secondary' : 'outline'}
            className="text-[10px]"
          >
            {Math.round(confidenceScore * 100)}% confidence
          </Badge>
        )}
      </div>

      {children}

      <AIFeedbackWidget
        resultId={resultId}
        workflowType={workflowType}
        entityId={entityId}
        entityType={entityType}
        originalSuggestion={originalSuggestion}
        displayedAt={displayedAt}
      />
    </div>
  );
};

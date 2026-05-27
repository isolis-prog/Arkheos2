/**
 * AIL Integration — Regulatory Semantic Validation for Pre-Submission Validator.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AISuggestionCard } from '@/components/ail/AIFeedbackWidget';
import { useAILInference } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface SemanticIssue {
  issue_id: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  description: string;
  field_or_section: string;
  suggested_correction: string | null;
}

interface RegulatoryValidationResult {
  overall_assessment: 'PASS' | 'PASS_WITH_WARNINGS' | 'REVIEW_REQUIRED';
  semantic_issues: SemanticIssue[];
  cross_report_consistency: {
    is_consistent: boolean;
    inconsistencies: string[];
  };
  regulatory_risk_notes: string[];
  recommendation: string;
}

const ASSESSMENT_COLORS: Record<string, string> = {
  PASS: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  PASS_WITH_WARNINGS: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  REVIEW_REQUIRED: 'bg-red-500/10 text-red-600 border-red-500/30',
};

interface AIRegulatoryValidationProps {
  reportType: string;
  validationData: Record<string, unknown>;
}

export const AIRegulatoryValidation = ({ reportType, validationData }: AIRegulatoryValidationProps) => {
  const { isEnabled } = useFeatureFlags();
  const { invoke, isLoading, error } = useAILInference();
  const [result, setResult] = useState<RegulatoryValidationResult | null>(null);
  const [resultId, setResultId] = useState('');

  if (!isEnabled('module.ail')) return null;

  const handleValidate = async () => {
    const res = await invoke({
      workflow_type: 'REGULATORY_SEMANTIC_VALIDATION',
      context_payload: { report_type: reportType, ...validationData, entity_id: `reg-${reportType}` },
      entity_type: 'REGULATORY_FILING',
      entity_id: `reg-${reportType}`,
      requesting_module: 'REGULATORY_REPORTING',
      priority: 'REALTIME',
    });
    if (res) {
      setResult(res.result_payload as unknown as RegulatoryValidationResult);
      setResultId(res.result_id);
    }
  };

  if (!result && !isLoading && !error) {
    return (
      <Button size="sm" variant="outline" onClick={handleValidate} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Run AI Semantic Validation
      </Button>
    );
  }

  return (
    <AISuggestionCard
      title="AI Semantic Validation"
      resultId={resultId}
      workflowType="REGULATORY_SEMANTIC_VALIDATION"
      entityId={`reg-${reportType}`}
      entityType="REGULATORY_FILING"
      originalSuggestion={result as unknown as Record<string, unknown>}
      isLoading={isLoading}
      error={error}
    >
      {result && (
        <div className="space-y-3 text-sm">
          {/* Disclaimer */}
          <Alert className="py-2 px-3">
            <Info className="h-3 w-3" />
            <AlertDescription className="text-[10px]">
              AI validation supplements but does not replace legal review. Consult qualified compliance counsel.
            </AlertDescription>
          </Alert>

          {/* Overall assessment */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={ASSESSMENT_COLORS[result.overall_assessment]}>
              {result.overall_assessment === 'PASS' && <CheckCircle className="h-3 w-3 mr-1" />}
              {result.overall_assessment === 'PASS_WITH_WARNINGS' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {result.overall_assessment === 'REVIEW_REQUIRED' && <XCircle className="h-3 w-3 mr-1" />}
              {result.overall_assessment.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Semantic issues */}
          {result.semantic_issues?.length > 0 && (
            <div className="space-y-1">
              {result.semantic_issues.map((issue) => (
                <div key={issue.issue_id} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
                  {issue.severity === 'ERROR' && <XCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />}
                  {issue.severity === 'WARNING' && <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />}
                  {issue.severity === 'INFO' && <Info className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />}
                  <div>
                    <span className="font-medium">{issue.field_or_section}:</span>{' '}
                    <span className="text-muted-foreground">{issue.description}</span>
                    {issue.suggested_correction && (
                      <p className="text-primary mt-0.5">Fix: {issue.suggested_correction}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cross-report consistency */}
          {!result.cross_report_consistency?.is_consistent && (
            <div className="text-xs text-amber-600">
              <p className="font-medium">Cross-report inconsistencies:</p>
              <ul className="list-disc list-inside">
                {result.cross_report_consistency.inconsistencies.map((inc, i) => (
                  <li key={i}>{inc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <p className="text-xs text-muted-foreground border-t pt-2">{result.recommendation}</p>
        </div>
      )}
    </AISuggestionCard>
  );
};

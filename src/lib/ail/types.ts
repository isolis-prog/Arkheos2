/**
 * ArkheOS Intelligence Layer (AIL) — Type definitions
 */

// ── Workflow Types ──
export type AILWorkflowType =
  | 'EXCEPTION_CLASSIFICATION'
  | 'SEMANTIC_MATCH_SUGGESTION'
  | 'PNL_EXPLANATION'
  | 'LIFECYCLE_PREDICTION'
  | 'RISK_BREACH_PREDICTION'
  | 'CLOSE_READINESS_PREDICTION'
  | 'NATURAL_LANGUAGE_QUERY'
  | 'TRADE_SUMMARY'
  | 'REGULATORY_SEMANTIC_VALIDATION'
  | 'CROSS_MODULE_DEAL_ANALYSIS';

export type AILResultType =
  | 'EXCEPTION_CLASSIFICATION'
  | 'MATCH_SUGGESTION'
  | 'PNL_EXPLANATION'
  | 'LIFECYCLE_PREDICTION'
  | 'RISK_PREDICTION'
  | 'CLOSE_PREDICTION'
  | 'QUERY_RESULT'
  | 'SUMMARY'
  | 'REGULATORY_VALIDATION'
  | 'CROSS_MODULE_ANALYSIS';

export type AILPriority = 'REALTIME' | 'NORMAL' | 'BATCH';

export type AILJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export type AILFeedbackType = 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'IGNORED' | 'ESCALATED';

export type AILTier = 'INTELLIGENCE' | 'INTELLIGENCE_PRO' | null;

// ── Tier workflow access ──
export const INTELLIGENCE_WORKFLOWS: AILWorkflowType[] = [
  'EXCEPTION_CLASSIFICATION',
  'SEMANTIC_MATCH_SUGGESTION',
  'LIFECYCLE_PREDICTION',
  'NATURAL_LANGUAGE_QUERY',
  'TRADE_SUMMARY',
  'CLOSE_READINESS_PREDICTION',
  'CROSS_MODULE_DEAL_ANALYSIS',
];

export const INTELLIGENCE_PRO_WORKFLOWS: AILWorkflowType[] = [
  ...INTELLIGENCE_WORKFLOWS,
  'PNL_EXPLANATION',
  'RISK_BREACH_PREDICTION',
  'REGULATORY_SEMANTIC_VALIDATION',
];

export function isWorkflowAvailable(tier: AILTier, workflow: AILWorkflowType): boolean {
  if (!tier) return false;
  if (tier === 'INTELLIGENCE_PRO') return INTELLIGENCE_PRO_WORKFLOWS.includes(workflow);
  return INTELLIGENCE_WORKFLOWS.includes(workflow);
}

// ── Inference Request ──
export interface AILInferenceRequest {
  request_id: string;
  tenant_id: string;
  requesting_module: string;
  workflow_type: AILWorkflowType;
  context_payload: Record<string, unknown>;
  priority: AILPriority;
  requested_by?: string;
  status: AILJobStatus;
  queued_at: string;
  completed_at?: string;
}

// ── Inference Result ──
export interface AILInferenceResult {
  result_id: string;
  request_id?: string;
  tenant_id: string;
  workflow_type: AILWorkflowType;
  entity_type: string;
  entity_id: string;
  result_type: AILResultType;
  result_payload: Record<string, unknown>;
  confidence_score?: number;
  model_version: string;
  tokens_used?: number;
  latency_ms?: number;
  created_at: string;
  displayed_at?: string;
  feedback_id?: string;
  is_active: boolean;
}

// ── Feedback ──
export interface AILFeedback {
  feedback_id: string;
  tenant_id: string;
  result_id: string;
  workflow_type: AILWorkflowType;
  entity_id: string;
  entity_type: string;
  user_id: string;
  feedback_type: AILFeedbackType;
  user_action_taken?: string;
  original_suggestion?: Record<string, unknown>;
  user_correction?: Record<string, unknown>;
  feedback_reason?: string;
  feedback_at: string;
  time_to_feedback_seconds?: number;
}

// ── Embedding Job ──
export interface AILEmbeddingJob {
  job_id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  trigger_event: string;
  job_type: 'EMBEDDING' | 'PATTERN_COMPUTATION' | 'GRAPH_BUILD';
  status: AILJobStatus;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  retry_count: number;
}

// ── Workflow Configuration ──
export interface AILWorkflowConfig {
  workflow_type: AILWorkflowType;
  display_name: string;
  description: string;
  is_enabled: boolean;
  min_confidence_threshold: number;
  auto_trigger: boolean;
  cooldown_hours: number;
  tier_required: 'INTELLIGENCE' | 'INTELLIGENCE_PRO';
}

export const DEFAULT_WORKFLOW_CONFIGS: AILWorkflowConfig[] = [
  { workflow_type: 'EXCEPTION_CLASSIFICATION', display_name: 'Exception Classification', description: 'AI-powered root cause analysis for exceptions', is_enabled: true, min_confidence_threshold: 0.65, auto_trigger: true, cooldown_hours: 1, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'SEMANTIC_MATCH_SUGGESTION', display_name: 'Semantic Match Suggestion', description: 'AI-suggested matches for unmatched bank lines', is_enabled: true, min_confidence_threshold: 0.70, auto_trigger: true, cooldown_hours: 1, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'PNL_EXPLANATION', display_name: 'P&L Explanation', description: 'Executive-level P&L variance explanations', is_enabled: true, min_confidence_threshold: 0.65, auto_trigger: false, cooldown_hours: 4, tier_required: 'INTELLIGENCE_PRO' },
  { workflow_type: 'LIFECYCLE_PREDICTION', display_name: 'Lifecycle Prediction', description: 'Predict trade settlement delays', is_enabled: true, min_confidence_threshold: 0.60, auto_trigger: true, cooldown_hours: 24, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'RISK_BREACH_PREDICTION', display_name: 'Risk Breach Prediction', description: 'Position limit breach forecasting', is_enabled: true, min_confidence_threshold: 0.65, auto_trigger: true, cooldown_hours: 4, tier_required: 'INTELLIGENCE_PRO' },
  { workflow_type: 'CLOSE_READINESS_PREDICTION', display_name: 'Close Readiness Prediction', description: 'Month-end close date forecasting', is_enabled: true, min_confidence_threshold: 0.60, auto_trigger: true, cooldown_hours: 24, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'NATURAL_LANGUAGE_QUERY', display_name: 'Natural Language Query', description: 'Convert natural language to SQL queries', is_enabled: true, min_confidence_threshold: 0.50, auto_trigger: false, cooldown_hours: 0, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'TRADE_SUMMARY', display_name: 'Trade Summary', description: 'AI-generated executive trade summaries', is_enabled: true, min_confidence_threshold: 0.50, auto_trigger: false, cooldown_hours: 1, tier_required: 'INTELLIGENCE' },
  { workflow_type: 'REGULATORY_SEMANTIC_VALIDATION', display_name: 'Regulatory Validation', description: 'Semantic validation for regulatory filings', is_enabled: true, min_confidence_threshold: 0.70, auto_trigger: false, cooldown_hours: 1, tier_required: 'INTELLIGENCE_PRO' },
];

// ── CDE Response Types ──
export interface ExceptionClassificationResult {
  probable_cause: string;
  cause_confidence: number;
  cause_category: string;
  suggested_action: string;
  action_steps: string[];
  similar_case_reference?: string;
  estimated_resolution_hours: number;
  escalate_to_management: boolean;
  financial_impact_usd: number;
}

export interface MatchSuggestionResult {
  top_match_cashflow_id: string | null;
  match_confidence: number;
  match_reasoning: string;
  amount_variance_explanation?: string;
  alternative_match_cashflow_id?: string;
  recommend_manual_review: boolean;
  manual_review_reason?: string;
}

export interface PnLExplanationResult {
  headline: string;
  total_variance_vs_prior_month_usd: number;
  total_variance_vs_budget_usd?: number;
  drivers: Array<{
    driver_name: string;
    driver_type: string;
    impact_usd: number;
    impact_pct_of_total_variance: number;
    explanation: string;
  }>;
  narrative: string;
  anomalies_detected: string[];
  recommended_actions: string[];
}

export interface TradeSummaryResult {
  headline: string;
  summary_paragraphs: string[];
  key_facts: Array<{ label: string; value: string }>;
  open_items: string[];
  financial_snapshot: {
    notional_value_usd: number;
    unrealized_pnl_usd?: number;
    cashflow_status: string;
  };
  risk_flags: string[];
}

export interface CrossModuleDealAnalysisResult {
  headline: string;
  executive_summary: string;
  cross_module_findings: Array<{
    module: string;
    finding: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  correlated_root_cause: string;
  recommended_actions: Array<{
    action: string;
    owner: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  risk_flags: string[];
  confidence: number;
}

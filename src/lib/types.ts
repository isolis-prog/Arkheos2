// ArkheOS Types

export type AppRole = 
  | 'platform_admin'
  | 'integration_admin'
  | 'recon_analyst'
  | 'accounting'
  | 'operations'
  | 'manager'
  | 'auditor';

export type ExceptionStatus = 
  | 'open'
  | 'in_progress'
  | 'pending_approval'
  | 'resolved'
  | 'closed';

export type AmendmentStatus = 
  | 'proposed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'exported'
  | 'closed';

export type MatchType = 
  | 'exact_1_1'
  | 'many_to_1'
  | '1_to_many'
  | 'many_to_many'
  | 'unmatched';

export type BreakType = 
  | 'MISSING_IN_ERP'
  | 'MISSING_IN_ETRM'
  | 'AMOUNT_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'DATE_MISMATCH'
  | 'DUPLICATE_IN_ERP'
  | 'DUPLICATE_IN_ETRM'
  | 'KEY_MISMATCH'
  | 'COMPLEX_GROUP';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  scopes: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface ReconciliationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  template_type: string;
  side_a_source: string;
  side_a_dataset: string;
  side_b_source: string;
  side_b_dataset: string;
  filters: Record<string, unknown>;
  cutoff_rules: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationRun {
  id: string;
  tenant_id: string;
  template_id: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  metrics: {
    total_side_a?: number;
    total_side_b?: number;
    matched?: number;
    breaks?: number;
    match_rate?: number;
    amount_at_risk?: number;
  };
  side_a_batch_ids: string[];
  side_b_batch_ids: string[];
  started_by: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface MatchGroup {
  id: string;
  run_id: string;
  rule_id: string | null;
  match_key: string | null;
  match_type: MatchType;
  status: string;
  side_a_total: number | null;
  side_b_total: number | null;
  delta: number | null;
  delta_pct: number | null;
  explainability: Record<string, unknown>;
  created_at: string;
}

export interface Exception {
  id: string;
  tenant_id: string;
  run_id: string;
  match_group_id: string | null;
  break_type: BreakType;
  severity: string;
  reason_code: string | null;
  reason_details: string | null;
  owner_role: AppRole | null;
  assigned_to: string | null;
  status: ExceptionStatus;
  sla_due_date: string | null;
  amount_at_risk: number | null;
  currency: string | null;
  metadata: Record<string, unknown>;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmendmentPlan {
  id: string;
  tenant_id: string;
  exception_id: string | null;
  match_group_id: string | null;
  target_system: string;
  action_type: string;
  payload: Record<string, unknown>;
  delta_summary: Record<string, unknown>;
  rationale: string | null;
  risk_flags: string[];
  status: AmendmentStatus;
  requires_approval: boolean;
  approval_threshold: number | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  exported_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestionBatch {
  id: string;
  tenant_id: string;
  source_system: string;
  dataset: string;
  file_name: string | null;
  status: string;
  stats: {
    total_rows?: number;
    valid_rows?: number;
    invalid_rows?: number;
    sum_amount?: number;
  };
  error_details: Record<string, unknown> | null;
  as_of_date: string | null;
  loaded_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CanonicalRecord {
  id: string;
  tenant_id: string;
  record_type: string;
  source_system: string;
  batch_id: string | null;
  raw_record_id: string | null;
  deal_id: string | null;
  strategy: string | null;
  fee_type: string | null;
  amount: number | null;
  currency: string | null;
  date_primary: string | null;
  posting_date: string | null;
  economic_date: string | null;
  counterparty: string | null;
  legal_entity: string | null;
  book_portfolio: string | null;
  doc_id: string | null;
  line_id: string | null;
  memo: string | null;
  attributes: Record<string, unknown>;
  match_key: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalReconciliations: number;
  matchRate: number;
  openExceptions: number;
  amountAtRisk: number;
  pendingAmendments: number;
  recentRuns: ReconciliationRun[];
}

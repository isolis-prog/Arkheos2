import { useState, useMemo } from 'react';
import { subDays, subMonths, subHours } from 'date-fns';

export type RulesetCategory = 'matching' | 'transform' | 'tolerance' | 'exception_policy';
export type RulesetStatus = 'draft' | 'review' | 'active' | 'archived';

export interface RuleCondition {
  id: string;
  left_field: string;
  operator: string;
  right_field?: string;
  value?: string | number;
  logic: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'match' | 'transform' | 'set_tolerance' | 'auto_close' | 'auto_assign' | 'set_severity';
  config: Record<string, unknown>;
}

export interface RuleDefinition {
  id: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export interface RulesetVersion {
  id: string;
  version_number: number;
  definition: { rules: RuleDefinition[] };
  change_reason: string;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  category: RulesetCategory;
  use_case: string;
  tags: string[];
  status: RulesetStatus;
  effective_from: string | null;
  effective_to: string | null;
  versions: RulesetVersion[];
  current_version: RulesetVersion | null;
  created_at: string;
  updated_at: string;
}

export interface RuleExecution {
  id: string;
  ruleset_id: string;
  ruleset_name: string;
  version_number: number;
  execution_type: 'simulation' | 'production';
  status: 'pending' | 'running' | 'completed' | 'failed';
  records_processed: number;
  records_matched: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Available operators
export const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'in_list', label: 'In List' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'fuzzy_match', label: 'Fuzzy Match' },
  { value: 'within_tolerance', label: 'Within Tolerance' },
];

export const AVAILABLE_FIELDS = [
  'deal_id', 'trade_id', 'invoice_number', 'counterparty', 'legal_entity',
  'amount', 'currency', 'fee_type', 'strategy', 'posting_date', 'economic_date',
  'book_portfolio', 'commodity', 'settlement_date', 'doc_id', 'line_id',
  'cost_center', 'gl_account', 'tax_code', 'uom', 'quantity', 'price',
];

// Demo data
function generateRulesets(): Ruleset[] {
  const matchingRules: RuleDefinition[] = [
    {
      id: 'r1', name: 'Primary Key Match', priority: 1, enabled: true,
      conditions: [
        { id: 'c1', left_field: 'deal_id', operator: 'equals', right_field: 'deal_id', logic: 'AND' },
        { id: 'c2', left_field: 'fee_type', operator: 'equals', right_field: 'fee_type', logic: 'AND' },
        { id: 'c3', left_field: 'currency', operator: 'equals', right_field: 'currency', logic: 'AND' },
      ],
      actions: [{ id: 'a1', type: 'match', config: { match_type: 'exact_1_1' } }],
    },
    {
      id: 'r2', name: 'Amount Tolerance Match', priority: 2, enabled: true,
      conditions: [
        { id: 'c4', left_field: 'deal_id', operator: 'equals', right_field: 'deal_id', logic: 'AND' },
        { id: 'c5', left_field: 'amount', operator: 'within_tolerance', right_field: 'amount', value: 0.01, logic: 'AND' },
      ],
      actions: [{ id: 'a2', type: 'match', config: { match_type: 'tolerance_match', tolerance_pct: 1 } }],
    },
    {
      id: 'r3', name: 'Fuzzy Counterparty + Date', priority: 3, enabled: true,
      conditions: [
        { id: 'c6', left_field: 'counterparty', operator: 'fuzzy_match', right_field: 'counterparty', value: 0.85, logic: 'AND' },
        { id: 'c7', left_field: 'posting_date', operator: 'within_tolerance', right_field: 'posting_date', value: 3, logic: 'AND' },
      ],
      actions: [{ id: 'a3', type: 'match', config: { match_type: 'fuzzy', needs_review: true } }],
    },
  ];

  const transformRules: RuleDefinition[] = [
    {
      id: 'r4', name: 'Uppercase Counterparty', priority: 1, enabled: true,
      conditions: [{ id: 'c8', left_field: 'counterparty', operator: 'not_equals', value: '', logic: 'AND' }],
      actions: [{ id: 'a4', type: 'transform', config: { field: 'counterparty', transform: 'uppercase' } }],
    },
    {
      id: 'r5', name: 'FX Rate Normalize', priority: 2, enabled: true,
      conditions: [{ id: 'c9', left_field: 'currency', operator: 'not_equals', value: 'USD', logic: 'AND' }],
      actions: [{ id: 'a5', type: 'transform', config: { field: 'amount', transform: 'fx_convert', target: 'USD' } }],
    },
  ];

  const toleranceRules: RuleDefinition[] = [
    {
      id: 'r6', name: 'USD Standard', priority: 1, enabled: true,
      conditions: [{ id: 'c10', left_field: 'currency', operator: 'equals', value: 'USD', logic: 'AND' }],
      actions: [{ id: 'a6', type: 'set_tolerance', config: { amount_pct: 0.5, amount_abs: 100, date_days: 2 } }],
    },
    {
      id: 'r7', name: 'EUR Tight Tolerance', priority: 2, enabled: true,
      conditions: [{ id: 'c11', left_field: 'currency', operator: 'equals', value: 'EUR', logic: 'AND' }],
      actions: [{ id: 'a7', type: 'set_tolerance', config: { amount_pct: 0.1, amount_abs: 50, date_days: 1 } }],
    },
  ];

  const exceptionRules: RuleDefinition[] = [
    {
      id: 'r8', name: 'Auto-close Small Breaks', priority: 1, enabled: true,
      conditions: [{ id: 'c12', left_field: 'amount', operator: 'less_than', value: 10, logic: 'AND' }],
      actions: [{ id: 'a8', type: 'auto_close', config: { reason: 'rounding_variance', max_amount: 10 } }],
    },
    {
      id: 'r9', name: 'Auto-assign Missing ERP', priority: 2, enabled: true,
      conditions: [{ id: 'c13', left_field: 'break_type', operator: 'equals', value: 'MISSING_IN_ERP', logic: 'AND' }],
      actions: [{ id: 'a9', type: 'auto_assign', config: { role: 'accounting', severity: 'high' } }],
    },
  ];

  const mkVersion = (rules: RuleDefinition[], num: number, active: boolean, reason: string, daysAgo: number): RulesetVersion => ({
    id: `v-${num}-${Math.random().toString(36).slice(2, 6)}`,
    version_number: num,
    definition: { rules },
    change_reason: reason,
    is_active: active,
    approved_by: active ? 'Demo User' : null,
    approved_at: active ? subDays(new Date(), daysAgo).toISOString() : null,
    created_by: 'Demo User',
    created_at: subDays(new Date(), daysAgo + 1).toISOString(),
  });

  return [
    {
      id: 'rs-1', name: 'ETRM ↔ ERP Fee Matching', description: 'Primary matching rules for ETRM fees against ERP postings', category: 'matching', use_case: 'ETRM↔ERP',
      tags: ['fees', 'matching', 'production'], status: 'active', effective_from: '2025-01-01', effective_to: null,
      versions: [mkVersion(matchingRules, 3, true, 'Added fuzzy counterparty rule', 5), mkVersion(matchingRules.slice(0, 2), 2, false, 'Added tolerance match', 30), mkVersion(matchingRules.slice(0, 1), 1, false, 'Initial version', 90)],
      current_version: mkVersion(matchingRules, 3, true, 'Added fuzzy counterparty rule', 5),
      created_at: subMonths(new Date(), 6).toISOString(), updated_at: subDays(new Date(), 5).toISOString(),
    },
    {
      id: 'rs-2', name: 'Subledger ↔ GL Reconciliation', description: 'Matching subledger entries to general ledger for close', category: 'matching', use_case: 'Subledger↔GL',
      tags: ['gl', 'subledger', 'close'], status: 'active', effective_from: '2025-01-01', effective_to: null,
      versions: [mkVersion(matchingRules, 2, true, 'Updated tolerance', 10)],
      current_version: mkVersion(matchingRules, 2, true, 'Updated tolerance', 10),
      created_at: subMonths(new Date(), 4).toISOString(), updated_at: subDays(new Date(), 10).toISOString(),
    },
    {
      id: 'rs-3', name: 'Data Normalization', description: 'Transform rules for counterparty names, FX conversion, date normalization', category: 'transform', use_case: 'All',
      tags: ['transform', 'fx', 'normalization'], status: 'active', effective_from: null, effective_to: null,
      versions: [mkVersion(transformRules, 1, true, 'Initial transforms', 60)],
      current_version: mkVersion(transformRules, 1, true, 'Initial transforms', 60),
      created_at: subMonths(new Date(), 3).toISOString(), updated_at: subMonths(new Date(), 2).toISOString(),
    },
    {
      id: 'rs-4', name: 'Currency Tolerances', description: 'Amount and date tolerances by currency pair', category: 'tolerance', use_case: 'ETRM↔ERP',
      tags: ['tolerance', 'currency', 'fx'], status: 'active', effective_from: '2025-01-01', effective_to: null,
      versions: [mkVersion(toleranceRules, 2, true, 'Tightened EUR tolerance', 15), mkVersion(toleranceRules, 1, false, 'Initial tolerances', 90)],
      current_version: mkVersion(toleranceRules, 2, true, 'Tightened EUR tolerance', 15),
      created_at: subMonths(new Date(), 5).toISOString(), updated_at: subDays(new Date(), 15).toISOString(),
    },
    {
      id: 'rs-5', name: 'Exception Auto-Actions', description: 'Automatic close, assign, and severity rules for exceptions', category: 'exception_policy', use_case: 'All',
      tags: ['exception', 'auto-close', 'auto-assign'], status: 'active', effective_from: null, effective_to: null,
      versions: [mkVersion(exceptionRules, 1, true, 'Initial exception policies', 45)],
      current_version: mkVersion(exceptionRules, 1, true, 'Initial exception policies', 45),
      created_at: subMonths(new Date(), 2).toISOString(), updated_at: subMonths(new Date(), 1).toISOString(),
    },
    {
      id: 'rs-6', name: 'Invoice Netting Rules', description: 'Rules for netting invoices by counterparty and period', category: 'matching', use_case: 'Invoices',
      tags: ['netting', 'invoices'], status: 'draft', effective_from: null, effective_to: null,
      versions: [mkVersion(matchingRules.slice(0, 1), 1, false, 'Draft version', 3)],
      current_version: null,
      created_at: subDays(new Date(), 3).toISOString(), updated_at: subDays(new Date(), 3).toISOString(),
    },
    {
      id: 'rs-7', name: 'Cashflow Matching', description: 'Matching rules for cashflow events across ETRM and treasury', category: 'matching', use_case: 'Cashflows',
      tags: ['cashflow', 'treasury'], status: 'review', effective_from: '2025-03-01', effective_to: null,
      versions: [mkVersion(matchingRules, 1, false, 'Initial cashflow rules', 7)],
      current_version: null,
      created_at: subDays(new Date(), 7).toISOString(), updated_at: subDays(new Date(), 7).toISOString(),
    },
  ];
}

function generateExecutions(rulesets: Ruleset[]): RuleExecution[] {
  const execs: RuleExecution[] = [];
  const activeRs = rulesets.filter(r => r.status === 'active');
  for (let i = 0; i < 15; i++) {
    const rs = activeRs[i % activeRs.length];
    const status = i < 10 ? 'completed' : (i < 13 ? 'running' : 'failed');
    const processed = 200 + Math.floor(Math.random() * 2000);
    execs.push({
      id: `exec-${i}`, ruleset_id: rs.id, ruleset_name: rs.name,
      version_number: rs.current_version?.version_number || 1,
      execution_type: i % 3 === 0 ? 'simulation' : 'production',
      status, records_processed: processed,
      records_matched: Math.floor(processed * (0.7 + Math.random() * 0.25)),
      records_failed: status === 'failed' ? Math.floor(processed * 0.3) : Math.floor(processed * 0.02),
      error_message: status === 'failed' ? 'Timeout evaluating rule r3 on batch 5' : null,
      started_at: subHours(new Date(), i * 4).toISOString(),
      completed_at: status !== 'running' ? subHours(new Date(), i * 4 - 1).toISOString() : null,
    });
  }
  return execs;
}

export function useRulesEngine() {
  const [rulesets] = useState(() => generateRulesets());
  const [executions] = useState(() => generateExecutions(rulesets));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRulesetId, setSelectedRulesetId] = useState<string | null>(null);

  const filteredRulesets = useMemo(() => {
    return rulesets.filter(rs => {
      if (categoryFilter !== 'all' && rs.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && rs.status !== statusFilter) return false;
      if (searchQuery && !rs.name.toLowerCase().includes(searchQuery.toLowerCase()) && !rs.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [rulesets, categoryFilter, statusFilter, searchQuery]);

  const selectedRuleset = useMemo(() => rulesets.find(r => r.id === selectedRulesetId) || null, [rulesets, selectedRulesetId]);

  const stats = useMemo(() => ({
    total: rulesets.length,
    active: rulesets.filter(r => r.status === 'active').length,
    draft: rulesets.filter(r => r.status === 'draft').length,
    review: rulesets.filter(r => r.status === 'review').length,
    totalExecutions: executions.length,
    successRate: Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100),
  }), [rulesets, executions]);

  return {
    rulesets, filteredRulesets, executions, stats,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedRulesetId, setSelectedRulesetId,
    selectedRuleset,
  };
}

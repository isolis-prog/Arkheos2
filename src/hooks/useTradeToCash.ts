import { useState, useMemo } from 'react';
import { format, subDays, subMonths, addDays } from 'date-fns';

// Types
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type RunStatus = 'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
export type DocStatus = 'pending' | 'validated' | 'posted' | 'failed' | 'reversed' | 'cancelled';
export type DocType = 'invoice' | 'voucher' | 'journal' | 'payment' | 'credit_note' | 'debit_note' | 'netting';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'validate' | 'post' | 'reconcile' | 'close';
  config: Record<string, unknown>;
  order: number;
}

export interface T2CWorkflow {
  id: string;
  name: string;
  description: string;
  commodity: string;
  business_unit: string;
  erp_target: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface T2CRun {
  id: string;
  workflow_id: string;
  workflow_name: string;
  period_start: string;
  period_end: string;
  status: RunStatus;
  current_step: string | null;
  steps_status: { step: string; status: string; started_at?: string; completed_at?: string; error?: string }[];
  totals: { documents: number; posted: number; failed: number; amount: number; currency: string };
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface T2CDocument {
  id: string;
  run_id: string;
  doc_type: DocType;
  source_id: string;
  source_system: string;
  erp_id: string | null;
  erp_system: string;
  counterparty: string;
  legal_entity: string;
  amount: number;
  currency: string;
  posting_date: string;
  status: DocStatus;
  idempotency_key: string;
  validation_errors: string[] | null;
  reversal_of: string | null;
  posted_at: string | null;
  reversed_at: string | null;
  created_at: string;
}

// Demo data generators
const COMMODITIES = ['Natural Gas', 'Crude Oil', 'Power', 'LNG', 'NGL'];
const BUS = ['Trading NA', 'Trading EU', 'Marketing', 'Supply & Logistics'];
const ERPS = ['SAP S/4HANA', 'Oracle Fusion', 'NetSuite'];
const COUNTERPARTIES = ['Shell Trading', 'BP Energy', 'TotalEnergies', 'Vitol SA', 'Glencore', 'Trafigura'];
const ENTITIES = ['ArkheOS US LLC', 'ArkheOS UK Ltd', 'ArkheOS SG Pte'];

const defaultSteps: WorkflowStep[] = [
  { id: '1', name: 'Extract ETRM Data', type: 'extract', config: { source: 'ETRM', objects: ['deals', 'settlements', 'fees'] }, order: 1 },
  { id: '2', name: 'Transform & Map', type: 'transform', config: { mappings: 'chart_of_accounts', fx_convert: true, tax_calc: true }, order: 2 },
  { id: '3', name: 'Validate', type: 'validate', config: { schema_check: true, balance_check: true, duplicate_check: true }, order: 3 },
  { id: '4', name: 'Post to ERP', type: 'post', config: { target: 'SAP', objects: ['AP', 'AR', 'GL'] }, order: 4 },
  { id: '5', name: 'Reconcile', type: 'reconcile', config: { compare: 'ERP_vs_ETRM', tolerance: 0.01 }, order: 5 },
  { id: '6', name: 'Close Period', type: 'close', config: { lock_period: true, generate_report: true }, order: 6 },
];

function generateWorkflows(): T2CWorkflow[] {
  return [
    { id: 'wf-1', name: 'NA Gas Settlements → SAP', description: 'End-to-end posting of NA gas settlements to SAP S/4HANA', commodity: 'Natural Gas', business_unit: 'Trading NA', erp_target: 'SAP S/4HANA', steps: defaultSteps, status: 'active', requires_approval: true, created_at: subMonths(new Date(), 6).toISOString(), updated_at: subDays(new Date(), 2).toISOString() },
    { id: 'wf-2', name: 'EU Power Invoices → Oracle', description: 'Power trading invoices to Oracle Fusion', commodity: 'Power', business_unit: 'Trading EU', erp_target: 'Oracle Fusion', steps: defaultSteps.map(s => ({ ...s, id: `2-${s.id}` })), status: 'active', requires_approval: false, created_at: subMonths(new Date(), 4).toISOString(), updated_at: subDays(new Date(), 5).toISOString() },
    { id: 'wf-3', name: 'Crude Oil Fees → NetSuite', description: 'Crude oil fee calculations to NetSuite', commodity: 'Crude Oil', business_unit: 'Supply & Logistics', erp_target: 'NetSuite', steps: defaultSteps.map(s => ({ ...s, id: `3-${s.id}` })), status: 'active', requires_approval: true, created_at: subMonths(new Date(), 3).toISOString(), updated_at: subDays(new Date(), 1).toISOString() },
    { id: 'wf-4', name: 'LNG Netting → SAP', description: 'LNG counterparty netting and journal entries', commodity: 'LNG', business_unit: 'Marketing', erp_target: 'SAP S/4HANA', steps: defaultSteps.map(s => ({ ...s, id: `4-${s.id}` })), status: 'draft', requires_approval: true, created_at: subDays(new Date(), 10).toISOString(), updated_at: subDays(new Date(), 10).toISOString() },
    { id: 'wf-5', name: 'NGL Payments → Oracle', description: 'NGL payment processing and GL posting', commodity: 'NGL', business_unit: 'Trading NA', erp_target: 'Oracle Fusion', steps: defaultSteps.map(s => ({ ...s, id: `5-${s.id}` })), status: 'paused', requires_approval: false, created_at: subMonths(new Date(), 2).toISOString(), updated_at: subDays(new Date(), 15).toISOString() },
  ];
}

const RUN_STATUSES: RunStatus[] = ['completed', 'completed_with_errors', 'failed', 'running', 'pending'];

function generateRuns(workflows: T2CWorkflow[]): T2CRun[] {
  const runs: T2CRun[] = [];
  const activeWfs = workflows.filter(w => w.status === 'active');
  
  for (let i = 0; i < 20; i++) {
    const wf = activeWfs[i % activeWfs.length];
    const daysAgo = i * 2;
    const status = RUN_STATUSES[i % RUN_STATUSES.length];
    const docs = 50 + Math.floor(Math.random() * 200);
    const posted = status === 'completed' ? docs : Math.floor(docs * 0.7);
    const failed = status === 'failed' ? Math.floor(docs * 0.3) : (status === 'completed_with_errors' ? Math.floor(docs * 0.05) : 0);

    runs.push({
      id: `run-${i + 1}`,
      workflow_id: wf.id,
      workflow_name: wf.name,
      period_start: format(subDays(new Date(), daysAgo + 30), 'yyyy-MM-dd'),
      period_end: format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'),
      status,
      current_step: status === 'running' ? defaultSteps[Math.floor(Math.random() * 6)].name : null,
      steps_status: defaultSteps.map((s, idx) => ({
        step: s.name,
        status: status === 'completed' ? 'completed' : (idx < 3 ? 'completed' : (idx === 3 && status === 'running' ? 'running' : 'pending')),
      })),
      totals: { documents: docs, posted, failed, amount: Math.round((500000 + Math.random() * 5000000) * 100) / 100, currency: 'USD' },
      error_message: status === 'failed' ? 'ERP connection timeout after 3 retries' : null,
      started_at: subDays(new Date(), daysAgo).toISOString(),
      completed_at: ['completed', 'completed_with_errors', 'failed'].includes(status) ? addDays(subDays(new Date(), daysAgo), 0).toISOString() : null,
      created_at: subDays(new Date(), daysAgo).toISOString(),
    });
  }
  return runs;
}

function generateDocuments(runs: T2CRun[]): T2CDocument[] {
  const docs: T2CDocument[] = [];
  const docTypes: DocType[] = ['invoice', 'voucher', 'journal', 'payment', 'credit_note'];
  const statuses: DocStatus[] = ['posted', 'posted', 'posted', 'validated', 'failed', 'pending', 'reversed'];

  for (const run of runs.slice(0, 5)) {
    const count = 8 + Math.floor(Math.random() * 12);
    for (let j = 0; j < count; j++) {
      const docType = docTypes[j % docTypes.length];
      const status = run.status === 'completed' ? 'posted' : statuses[j % statuses.length];
      docs.push({
        id: `doc-${run.id}-${j}`,
        run_id: run.id,
        doc_type: docType,
        source_id: `ETRM-${10000 + j}`,
        source_system: 'Endur',
        erp_id: status === 'posted' ? `ERP-${90000 + j}` : null,
        erp_system: 'SAP',
        counterparty: COUNTERPARTIES[j % COUNTERPARTIES.length],
        legal_entity: ENTITIES[j % ENTITIES.length],
        amount: Math.round((1000 + Math.random() * 500000) * 100) / 100,
        currency: ['USD', 'EUR', 'GBP'][j % 3],
        posting_date: run.period_end,
        status,
        idempotency_key: `${run.id}-${docType}-${j}`,
        validation_errors: status === 'failed' ? ['Amount exceeds threshold', 'Missing cost center'] : null,
        reversal_of: status === 'reversed' ? `doc-${run.id}-${j - 1}` : null,
        posted_at: status === 'posted' ? run.completed_at : null,
        reversed_at: status === 'reversed' ? new Date().toISOString() : null,
        created_at: run.created_at,
      });
    }
  }
  return docs;
}

export function useTradeToCash() {
  const [workflows] = useState<T2CWorkflow[]>(() => generateWorkflows());
  const [runs] = useState<T2CRun[]>(() => generateRuns(workflows));
  const [documents] = useState<T2CDocument[]>(() => generateDocuments(runs));

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [workflows, statusFilter, searchQuery]);

  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery && !r.workflow_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [runs, statusFilter, searchQuery]);

  const selectedRunDocs = useMemo(() => {
    if (!selectedRunId) return [];
    return documents.filter(d => d.run_id === selectedRunId);
  }, [documents, selectedRunId]);

  const pendingApprovalDocs = useMemo(() => {
    return documents.filter(d => d.status === 'validated');
  }, [documents]);

  const stats = useMemo(() => ({
    totalRuns: runs.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    completedRuns: runs.filter(r => r.status === 'completed').length,
    failedRuns: runs.filter(r => r.status === 'failed').length,
    totalPosted: documents.filter(d => d.status === 'posted').length,
    totalAmount: runs.reduce((s, r) => s + r.totals.amount, 0),
    pendingApproval: pendingApprovalDocs.length,
  }), [runs, workflows, documents, pendingApprovalDocs]);

  return {
    workflows, filteredWorkflows,
    runs, filteredRuns,
    documents, selectedRunDocs, pendingApprovalDocs,
    stats,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedRunId, setSelectedRunId,
  };
}

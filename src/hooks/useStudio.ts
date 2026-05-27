import { useState } from 'react';

// Types
export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transform?: string;
  defaultValue?: string;
  required: boolean;
}

export interface StudioMapping {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  fieldMappings: FieldMapping[];
  status: 'draft' | 'active' | 'archived';
  version: number;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'validate' | 'post' | 'reconcile' | 'notify' | 'custom';
  config: Record<string, unknown>;
  order: number;
  mappingId?: string;
  onFailure?: 'stop' | 'skip' | 'retry';
  retries?: number;
}

export interface StudioWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggerType: 'manual' | 'scheduled' | 'event' | 'webhook';
  scheduleCron?: string;
  scheduleTimezone: string;
  executionWindowStart?: string;
  executionWindowEnd?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: number;
  updatedAt: string;
}

export interface StudioVersion {
  id: string;
  entityType: 'mapping' | 'workflow';
  entityId: string;
  entityName: string;
  versionNumber: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'promoted' | 'rolled_back';
  changeReason: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StudioRun {
  id: string;
  workflowName: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  isTest: boolean;
  triggerType: string;
  inputSummary: { records: number; source: string };
  outputSummary?: { matched: number; exceptions: number; posted: number };
  stepResults: { step: string; status: string; duration: number; records: number }[];
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

// Demo data
const demoMappings: StudioMapping[] = [
  {
    id: 'm1', name: 'ETRM → GL Posting', description: 'Maps trade captures to GL journal entries',
    sourceSystem: 'Endur', targetSystem: 'SAP FI', status: 'active', version: 3, updatedAt: '2026-02-14T10:00:00Z',
    fieldMappings: [
      { id: 'f1', sourceField: 'deal_id', targetField: 'reference', required: true },
      { id: 'f2', sourceField: 'trade_date', targetField: 'posting_date', transform: 'dateFormat(YYYY-MM-DD)', required: true },
      { id: 'f3', sourceField: 'net_amount', targetField: 'amount', transform: 'round(2)', required: true },
      { id: 'f4', sourceField: 'currency', targetField: 'currency_code', required: true },
      { id: 'f5', sourceField: 'counterparty_code', targetField: 'bp_number', transform: 'lookup(cp_map)', required: true },
      { id: 'f6', sourceField: 'book', targetField: 'profit_center', transform: 'lookup(book_map)', required: false },
    ],
  },
  {
    id: 'm2', name: 'Invoice → Cashflow', description: 'Maps AR/AP invoices to cashflow events',
    sourceSystem: 'SAP SD', targetSystem: 'ArkheOS CF', status: 'active', version: 2, updatedAt: '2026-02-13T14:30:00Z',
    fieldMappings: [
      { id: 'f7', sourceField: 'invoice_no', targetField: 'reference', required: true },
      { id: 'f8', sourceField: 'due_date', targetField: 'value_date', required: true },
      { id: 'f9', sourceField: 'gross_amount', targetField: 'amount_original', required: true },
      { id: 'f10', sourceField: 'doc_currency', targetField: 'currency_original', required: true },
    ],
  },
  {
    id: 'm3', name: 'Movement → Inventory', description: 'Maps physical movements to inventory snapshots',
    sourceSystem: 'Scheduling', targetSystem: 'ArkheOS Logistics', status: 'draft', version: 1, updatedAt: '2026-02-12T09:00:00Z',
    fieldMappings: [
      { id: 'f11', sourceField: 'shipment_id', targetField: 'movement_ref', required: true },
      { id: 'f12', sourceField: 'quantity', targetField: 'volume', transform: 'convertUOM(bbl)', required: true },
    ],
  },
];

const demoWorkflows: StudioWorkflow[] = [
  {
    id: 'w1', name: 'Daily Trade-to-Cash', description: 'End-to-end trade capture through GL posting and reconciliation',
    triggerType: 'scheduled', scheduleCron: '0 6 * * 1-5', scheduleTimezone: 'America/New_York',
    executionWindowStart: '06:00', executionWindowEnd: '08:00', status: 'active', version: 5, updatedAt: '2026-02-14T06:00:00Z',
    steps: [
      { id: 's1', name: 'Extract Trades', type: 'extract', order: 1, config: { source: 'Endur', query: 'today_trades' }, onFailure: 'stop' },
      { id: 's2', name: 'Apply Mapping', type: 'transform', order: 2, config: { mappingId: 'm1' }, mappingId: 'm1', onFailure: 'stop' },
      { id: 's3', name: 'Validate Entries', type: 'validate', order: 3, config: { rules: ['balance_check', 'mandatory_fields', 'period_open'] }, onFailure: 'stop' },
      { id: 's4', name: 'Post to GL', type: 'post', order: 4, config: { target: 'SAP FI', mode: 'batch' }, onFailure: 'retry', retries: 3 },
      { id: 's5', name: 'Reconcile', type: 'reconcile', order: 5, config: { template: 'trade_vs_gl' }, onFailure: 'skip' },
      { id: 's6', name: 'Notify Team', type: 'notify', order: 6, config: { channel: 'email', recipients: ['ops@acme.com'] }, onFailure: 'skip' },
    ],
  },
  {
    id: 'w2', name: 'Weekly FX Revaluation', description: 'Revalue open FX positions and post adjustments',
    triggerType: 'scheduled', scheduleCron: '0 18 * * 5', scheduleTimezone: 'Europe/London',
    status: 'active', version: 2, updatedAt: '2026-02-07T18:00:00Z',
    steps: [
      { id: 's7', name: 'Extract Positions', type: 'extract', order: 1, config: { source: 'Treasury' }, onFailure: 'stop' },
      { id: 's8', name: 'Revalue', type: 'transform', order: 2, config: { method: 'spot_rate' }, onFailure: 'stop' },
      { id: 's9', name: 'Post Adjustments', type: 'post', order: 3, config: { target: 'SAP FI' }, onFailure: 'retry', retries: 2 },
    ],
  },
  {
    id: 'w3', name: 'Invoice Matching', description: 'Match received invoices against POs and goods receipts',
    triggerType: 'event', status: 'draft', version: 1, updatedAt: '2026-02-10T12:00:00Z', scheduleTimezone: 'UTC',
    steps: [
      { id: 's10', name: 'Ingest Invoice', type: 'extract', order: 1, config: { source: 'AP Inbox' }, onFailure: 'stop' },
      { id: 's11', name: 'Map Fields', type: 'transform', order: 2, config: { mappingId: 'm2' }, mappingId: 'm2', onFailure: 'stop' },
      { id: 's12', name: '3-Way Match', type: 'reconcile', order: 3, config: { type: 'three_way' }, onFailure: 'skip' },
    ],
  },
];

const demoVersions: StudioVersion[] = [
  { id: 'v1', entityType: 'workflow', entityId: 'w1', entityName: 'Daily Trade-to-Cash', versionNumber: 5, status: 'approved', changeReason: 'Added notification step', createdBy: 'John Doe', createdAt: '2026-02-14T10:00:00Z', approvedBy: 'Jane Smith', approvedAt: '2026-02-14T11:00:00Z' },
  { id: 'v2', entityType: 'workflow', entityId: 'w1', entityName: 'Daily Trade-to-Cash', versionNumber: 4, status: 'promoted', changeReason: 'Added retry on post step', createdBy: 'John Doe', createdAt: '2026-02-10T09:00:00Z', approvedBy: 'Jane Smith', approvedAt: '2026-02-10T10:00:00Z' },
  { id: 'v3', entityType: 'mapping', entityId: 'm1', entityName: 'ETRM → GL Posting', versionNumber: 3, status: 'approved', changeReason: 'Added profit_center mapping', createdBy: 'Alice Chen', createdAt: '2026-02-13T08:00:00Z', approvedBy: 'Bob Wilson', approvedAt: '2026-02-13T09:30:00Z' },
  { id: 'v4', entityType: 'workflow', entityId: 'w2', entityName: 'Weekly FX Revaluation', versionNumber: 2, status: 'pending_approval', changeReason: 'Changed revaluation method', createdBy: 'Alice Chen', createdAt: '2026-02-15T08:00:00Z' },
  { id: 'v5', entityType: 'mapping', entityId: 'm3', entityName: 'Movement → Inventory', versionNumber: 1, status: 'draft', changeReason: 'Initial version', createdBy: 'John Doe', createdAt: '2026-02-12T09:00:00Z' },
];

const demoRuns: StudioRun[] = [
  { id: 'r1', workflowName: 'Daily Trade-to-Cash', workflowId: 'w1', status: 'completed', isTest: false, triggerType: 'scheduled', inputSummary: { records: 342, source: 'Endur' }, outputSummary: { matched: 338, exceptions: 4, posted: 338 }, stepResults: [
    { step: 'Extract Trades', status: 'completed', duration: 2400, records: 342 },
    { step: 'Apply Mapping', status: 'completed', duration: 1800, records: 342 },
    { step: 'Validate Entries', status: 'completed', duration: 950, records: 340 },
    { step: 'Post to GL', status: 'completed', duration: 5200, records: 338 },
    { step: 'Reconcile', status: 'completed', duration: 3100, records: 338 },
    { step: 'Notify Team', status: 'completed', duration: 300, records: 1 },
  ], startedAt: '2026-02-15T06:00:00Z', completedAt: '2026-02-15T06:14:00Z', durationMs: 13750 },
  { id: 'r2', workflowName: 'Daily Trade-to-Cash', workflowId: 'w1', status: 'completed', isTest: true, triggerType: 'manual', inputSummary: { records: 10, source: 'Sample Dataset' }, outputSummary: { matched: 9, exceptions: 1, posted: 9 }, stepResults: [
    { step: 'Extract Trades', status: 'completed', duration: 200, records: 10 },
    { step: 'Apply Mapping', status: 'completed', duration: 150, records: 10 },
    { step: 'Validate Entries', status: 'completed', duration: 80, records: 10 },
    { step: 'Post to GL', status: 'completed', duration: 400, records: 9 },
    { step: 'Reconcile', status: 'completed', duration: 300, records: 9 },
    { step: 'Notify Team', status: 'skipped', duration: 0, records: 0 },
  ], startedAt: '2026-02-15T05:45:00Z', completedAt: '2026-02-15T05:46:00Z', durationMs: 1130 },
  { id: 'r3', workflowName: 'Weekly FX Revaluation', workflowId: 'w2', status: 'failed', isTest: false, triggerType: 'scheduled', inputSummary: { records: 89, source: 'Treasury' }, stepResults: [
    { step: 'Extract Positions', status: 'completed', duration: 1200, records: 89 },
    { step: 'Revalue', status: 'failed', duration: 800, records: 0 },
  ], errorMessage: 'Missing spot rate for THB/USD on 2026-02-14', startedAt: '2026-02-14T18:00:00Z', completedAt: '2026-02-14T18:02:00Z', durationMs: 2000 },
];

export const useStudio = () => {
  const [mappings] = useState<StudioMapping[]>(demoMappings);
  const [workflows] = useState<StudioWorkflow[]>(demoWorkflows);
  const [versions] = useState<StudioVersion[]>(demoVersions);
  const [runs] = useState<StudioRun[]>(demoRuns);
  const [activeTab, setActiveTab] = useState('mappings');

  return { mappings, workflows, versions, runs, activeTab, setActiveTab };
};

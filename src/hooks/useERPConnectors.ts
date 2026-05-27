import { useState } from 'react';

// Types
export type ERPType = 'sap' | 'oracle' | 'netsuite' | 'dynamics' | 'custom';
export type ERPEnv = 'production' | 'uat' | 'sandbox';
export type ERPAuthType = 'oauth2' | 'api_key' | 'certificate' | 'sso_saml';
export type ERPConnectorStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';
export type ERPRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type ERPHealth = 'green' | 'yellow' | 'red';
export type ERPLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ERPConnector {
  id: string;
  tenant_id: string;
  name: string;
  erp_type: ERPType;
  environment: ERPEnv;
  auth_type: ERPAuthType;
  auth_config: Record<string, any>;
  connection_config: Record<string, any>;
  sync_objects: string[];
  mapping_config: Record<string, any>;
  schedule_cron: string | null;
  schedule_enabled: boolean;
  status: ERPConnectorStatus;
  health: ERPHealth;
  health_message: string | null;
  last_sync_at: string | null;
  feature_flags: Record<string, any>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERPConnectorRun {
  id: string;
  connector_id: string;
  tenant_id: string;
  status: ERPRunStatus;
  direction: string;
  object_types: string[];
  started_at: string;
  ended_at: string | null;
  stats: Record<string, any>;
  error_message: string | null;
  created_at: string;
}

export interface ERPConnectorLog {
  id: string;
  run_id: string;
  tenant_id: string;
  level: ERPLogLevel;
  message: string;
  payload_ref: Record<string, any> | null;
  created_at: string;
}

// Sync object options per ERP type
export const SYNC_OBJECTS = [
  'General Ledger',
  'Accounts Payable',
  'Accounts Receivable',
  'Invoices',
  'Payments',
  'Journals',
  'Vendors',
  'Customers',
  'Tax Codes',
  'FX Rates',
  'Cost Centers',
  'Chart of Accounts',
] as const;

export const ERP_LABELS: Record<ERPType, string> = {
  sap: 'SAP S/4HANA',
  oracle: 'Oracle EBS / Fusion',
  netsuite: 'NetSuite',
  dynamics: 'Microsoft Dynamics 365',
  custom: 'Custom REST',
};

export const ERP_COLORS: Record<ERPType, string> = {
  sap: 'hsl(var(--info))',
  oracle: 'hsl(var(--destructive))',
  netsuite: 'hsl(var(--accent))',
  dynamics: 'hsl(var(--primary))',
  custom: 'hsl(var(--muted-foreground))',
};

// Demo data
const DEMO_CONNECTORS: ERPConnector[] = [
  {
    id: 'erp-1',
    tenant_id: 'demo',
    name: 'SAP S/4HANA Production',
    erp_type: 'sap',
    environment: 'production',
    auth_type: 'oauth2',
    auth_config: { client_id: '***', grant_type: 'client_credentials' },
    connection_config: { host: 'sap-prod.trafigura.com', port: 443, company_code: '1000', client: '100' },
    sync_objects: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Invoices', 'Payments', 'Journals', 'Vendors', 'FX Rates'],
    mapping_config: { coa_mapping: 'standard', entity_mapping: 'auto' },
    schedule_cron: '0 */4 * * *',
    schedule_enabled: true,
    status: 'active',
    health: 'green',
    health_message: 'All systems operational',
    last_sync_at: new Date(Date.now() - 1800000).toISOString(),
    feature_flags: { incremental_sync: true, parallel_fetch: true },
    created_by: null,
    updated_by: null,
    created_at: '2025-03-15T10:00:00Z',
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'erp-2',
    tenant_id: 'demo',
    name: 'Oracle Fusion UAT',
    erp_type: 'oracle',
    environment: 'uat',
    auth_type: 'api_key',
    auth_config: { api_key: '***' },
    connection_config: { host: 'oracle-uat.trafigura.com', business_unit: 'BU001' },
    sync_objects: ['General Ledger', 'Accounts Payable', 'Invoices', 'Journals'],
    mapping_config: {},
    schedule_cron: '0 6 * * *',
    schedule_enabled: true,
    status: 'active',
    health: 'yellow',
    health_message: 'High latency detected (avg 4.2s)',
    last_sync_at: new Date(Date.now() - 7200000).toISOString(),
    feature_flags: {},
    created_by: null,
    updated_by: null,
    created_at: '2025-05-01T08:00:00Z',
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'erp-3',
    tenant_id: 'demo',
    name: 'NetSuite Production',
    erp_type: 'netsuite',
    environment: 'production',
    auth_type: 'oauth2',
    auth_config: { consumer_key: '***', token_id: '***' },
    connection_config: { account_id: '1234567', subsidiary: 'Shell Trading US' },
    sync_objects: ['General Ledger', 'Invoices', 'Payments', 'Customers', 'Vendors', 'Tax Codes'],
    mapping_config: { coa_mapping: 'custom' },
    schedule_cron: '0 */2 * * *',
    schedule_enabled: true,
    status: 'active',
    health: 'green',
    health_message: null,
    last_sync_at: new Date(Date.now() - 3600000).toISOString(),
    feature_flags: { saved_search: true },
    created_by: null,
    updated_by: null,
    created_at: '2025-04-20T12:00:00Z',
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'erp-4',
    tenant_id: 'demo',
    name: 'Dynamics 365 F&O',
    erp_type: 'dynamics',
    environment: 'production',
    auth_type: 'oauth2',
    auth_config: { tenant_id: '***', client_id: '***' },
    connection_config: { environment_url: 'https://dynamics-prod.operations.dynamics.com', legal_entity: 'USMF' },
    sync_objects: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Vendors', 'Customers'],
    mapping_config: {},
    schedule_cron: null,
    schedule_enabled: false,
    status: 'paused',
    health: 'red',
    health_message: 'OAuth token expired — re-authenticate required',
    last_sync_at: '2026-01-28T14:00:00Z',
    feature_flags: {},
    created_by: null,
    updated_by: null,
    created_at: '2025-06-10T09:00:00Z',
    updated_at: '2026-01-28T14:00:00Z',
  },
  {
    id: 'erp-5',
    tenant_id: 'demo',
    name: 'Custom REST – Internal Ledger',
    erp_type: 'custom',
    environment: 'production',
    auth_type: 'api_key',
    auth_config: { header_name: 'X-API-Key', api_key: '***' },
    connection_config: { base_url: 'https://ledger-api.internal.corp/v2', timeout_ms: 30000 },
    sync_objects: ['General Ledger', 'Journals', 'FX Rates'],
    mapping_config: { response_path: 'data.records' },
    schedule_cron: '*/30 * * * *',
    schedule_enabled: true,
    status: 'active',
    health: 'green',
    health_message: null,
    last_sync_at: new Date(Date.now() - 900000).toISOString(),
    feature_flags: { pagination: true },
    created_by: null,
    updated_by: null,
    created_at: '2025-07-01T11:00:00Z',
    updated_at: new Date(Date.now() - 900000).toISOString(),
  },
];

const DEMO_RUNS: ERPConnectorRun[] = [
  { id: 'run-1', connector_id: 'erp-1', tenant_id: 'demo', status: 'completed', direction: 'pull', object_types: ['General Ledger', 'Invoices'], started_at: new Date(Date.now() - 1800000).toISOString(), ended_at: new Date(Date.now() - 1500000).toISOString(), stats: { records_fetched: 12450, records_mapped: 12448, errors: 2, duration_s: 300 }, error_message: null, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'run-2', connector_id: 'erp-1', tenant_id: 'demo', status: 'completed', direction: 'pull', object_types: ['Accounts Payable', 'Payments'], started_at: new Date(Date.now() - 16200000).toISOString(), ended_at: new Date(Date.now() - 15900000).toISOString(), stats: { records_fetched: 3280, records_mapped: 3280, errors: 0, duration_s: 180 }, error_message: null, created_at: new Date(Date.now() - 16200000).toISOString() },
  { id: 'run-3', connector_id: 'erp-2', tenant_id: 'demo', status: 'completed', direction: 'pull', object_types: ['General Ledger'], started_at: new Date(Date.now() - 7200000).toISOString(), ended_at: new Date(Date.now() - 6600000).toISOString(), stats: { records_fetched: 8900, records_mapped: 8895, errors: 5, duration_s: 600 }, error_message: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'run-4', connector_id: 'erp-4', tenant_id: 'demo', status: 'failed', direction: 'pull', object_types: ['General Ledger'], started_at: '2026-01-28T14:00:00Z', ended_at: '2026-01-28T14:00:12Z', stats: {}, error_message: 'OAuth2 token refresh failed: 401 Unauthorized', created_at: '2026-01-28T14:00:00Z' },
  { id: 'run-5', connector_id: 'erp-3', tenant_id: 'demo', status: 'completed', direction: 'pull', object_types: ['Invoices', 'Payments', 'Customers'], started_at: new Date(Date.now() - 3600000).toISOString(), ended_at: new Date(Date.now() - 3300000).toISOString(), stats: { records_fetched: 5670, records_mapped: 5670, errors: 0, duration_s: 240 }, error_message: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'run-6', connector_id: 'erp-5', tenant_id: 'demo', status: 'running', direction: 'pull', object_types: ['General Ledger', 'FX Rates'], started_at: new Date(Date.now() - 120000).toISOString(), ended_at: null, stats: { records_fetched: 1200 }, error_message: null, created_at: new Date(Date.now() - 120000).toISOString() },
];

const DEMO_LOGS: ERPConnectorLog[] = [
  { id: 'log-1', run_id: 'run-1', tenant_id: 'demo', level: 'info', message: 'Starting GL extraction from SAP (company code 1000)', payload_ref: null, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'log-2', run_id: 'run-1', tenant_id: 'demo', level: 'info', message: 'Fetched 12,450 GL line items (period 2026-01)', payload_ref: null, created_at: new Date(Date.now() - 1700000).toISOString() },
  { id: 'log-3', run_id: 'run-1', tenant_id: 'demo', level: 'warn', message: '2 records skipped: missing cost center mapping for CC-9901, CC-9902', payload_ref: { skipped_records: ['CC-9901', 'CC-9902'] }, created_at: new Date(Date.now() - 1600000).toISOString() },
  { id: 'log-4', run_id: 'run-1', tenant_id: 'demo', level: 'info', message: 'Sync completed successfully. 12,448 records mapped.', payload_ref: null, created_at: new Date(Date.now() - 1500000).toISOString() },
  { id: 'log-5', run_id: 'run-4', tenant_id: 'demo', level: 'error', message: 'OAuth2 token refresh failed: 401 Unauthorized. Check client credentials.', payload_ref: { http_status: 401 }, created_at: '2026-01-28T14:00:12Z' },
  { id: 'log-6', run_id: 'run-3', tenant_id: 'demo', level: 'info', message: 'Oracle GL extraction started for BU001', payload_ref: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'log-7', run_id: 'run-3', tenant_id: 'demo', level: 'warn', message: 'Slow response from Oracle API (avg 4.2s per batch)', payload_ref: { avg_latency_ms: 4200 }, created_at: new Date(Date.now() - 7000000).toISOString() },
];

export const useERPConnectors = () => {
  const [connectors] = useState<ERPConnector[]>(DEMO_CONNECTORS);
  const [runs] = useState<ERPConnectorRun[]>(DEMO_RUNS);
  const [logs] = useState<ERPConnectorLog[]>(DEMO_LOGS);
  const [isLoading] = useState(false);

  const getConnectorRuns = (connectorId: string) =>
    runs.filter((r) => r.connector_id === connectorId).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  const getRunLogs = (runId: string) =>
    logs.filter((l) => l.run_id === runId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return { connectors, runs, logs, isLoading, getConnectorRuns, getRunLogs };
};

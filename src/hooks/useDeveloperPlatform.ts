import { useState, useMemo } from 'react';
import { subDays, subHours, subMinutes } from 'date-fns';

// Types
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
export type WebhookStatus = 'active' | 'paused' | 'disabled';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  status: ApiKeyStatus;
  rate_limit_per_minute: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiAuditLog {
  id: string;
  api_key_id: string;
  api_key_name: string;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
  ip_address: string;
  idempotency_key: string | null;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  retry_policy: { max_retries: number; backoff_seconds: number[] };
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: DeliveryStatus;
  attempts: number;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
}

// Available scopes
export const API_SCOPES = [
  'reconciliations.read', 'reconciliations.write',
  'exceptions.read', 'exceptions.write',
  'templates.read', 'templates.write',
  'connectors.read', 'connectors.write',
  't2c.read', 't2c.write',
  'datasets.import', 'datasets.export',
  'evidence.read', 'evidence.write',
] as const;

// Available webhook events
export const WEBHOOK_EVENTS = [
  'reconciliation.completed', 'reconciliation.failed',
  'exception.created', 'exception.resolved',
  'posting.completed', 'posting.failed',
  'connector.run.completed', 'connector.run.failed',
  'template.published', 'dataset.imported',
] as const;

// OpenAPI spec endpoints
export const API_ENDPOINTS = [
  { method: 'GET', path: '/v1/reconciliations', summary: 'List reconciliation runs', scopes: ['reconciliations.read'], tag: 'Reconciliations' },
  { method: 'GET', path: '/v1/reconciliations/{id}', summary: 'Get reconciliation run details', scopes: ['reconciliations.read'], tag: 'Reconciliations' },
  { method: 'POST', path: '/v1/reconciliations', summary: 'Start a new reconciliation run', scopes: ['reconciliations.write'], tag: 'Reconciliations' },
  { method: 'GET', path: '/v1/exceptions', summary: 'List exceptions', scopes: ['exceptions.read'], tag: 'Exceptions' },
  { method: 'GET', path: '/v1/exceptions/{id}', summary: 'Get exception details', scopes: ['exceptions.read'], tag: 'Exceptions' },
  { method: 'PATCH', path: '/v1/exceptions/{id}', summary: 'Update exception status', scopes: ['exceptions.write'], tag: 'Exceptions' },
  { method: 'GET', path: '/v1/templates', summary: 'List reconciliation templates', scopes: ['templates.read'], tag: 'Templates' },
  { method: 'GET', path: '/v1/templates/{id}', summary: 'Get template with version history', scopes: ['templates.read'], tag: 'Templates' },
  { method: 'POST', path: '/v1/templates', summary: 'Create a new template', scopes: ['templates.write'], tag: 'Templates' },
  { method: 'GET', path: '/v1/connectors', summary: 'List ERP connectors', scopes: ['connectors.read'], tag: 'Connectors' },
  { method: 'POST', path: '/v1/connectors/{id}/sync', summary: 'Trigger connector sync', scopes: ['connectors.write'], tag: 'Connectors' },
  { method: 'GET', path: '/v1/t2c/workflows', summary: 'List Trade-to-Cash workflows', scopes: ['t2c.read'], tag: 'Trade-to-Cash' },
  { method: 'GET', path: '/v1/t2c/runs', summary: 'List T2C runs', scopes: ['t2c.read'], tag: 'Trade-to-Cash' },
  { method: 'POST', path: '/v1/t2c/runs', summary: 'Start a new T2C run', scopes: ['t2c.write'], tag: 'Trade-to-Cash' },
  { method: 'POST', path: '/v1/datasets/import', summary: 'Import a dataset (CSV/JSON)', scopes: ['datasets.import'], tag: 'Datasets' },
  { method: 'GET', path: '/v1/datasets/export/{id}', summary: 'Export a dataset', scopes: ['datasets.export'], tag: 'Datasets' },
  { method: 'GET', path: '/v1/evidence/{exceptionId}', summary: 'Get evidence pack for exception', scopes: ['evidence.read'], tag: 'Evidence' },
  { method: 'POST', path: '/v1/evidence/{exceptionId}', summary: 'Upload evidence attachment', scopes: ['evidence.write'], tag: 'Evidence' },
];

// Demo data
function generateApiKeys(): ApiKey[] {
  return [
    { id: 'ak-1', name: 'Production Integration', key_prefix: 'hh_live_7kX3', scopes: ['reconciliations.read', 'exceptions.read', 'templates.read'], status: 'active', rate_limit_per_minute: 120, expires_at: null, last_used_at: subMinutes(new Date(), 3).toISOString(), created_at: subDays(new Date(), 90).toISOString() },
    { id: 'ak-2', name: 'BI Dashboard Feed', key_prefix: 'hh_live_mP9q', scopes: ['reconciliations.read', 'exceptions.read', 'datasets.export'], status: 'active', rate_limit_per_minute: 60, expires_at: null, last_used_at: subHours(new Date(), 1).toISOString(), created_at: subDays(new Date(), 60).toISOString() },
    { id: 'ak-3', name: 'ETRM Data Loader', key_prefix: 'hh_live_nR2w', scopes: ['datasets.import', 'reconciliations.write', 't2c.write'], status: 'active', rate_limit_per_minute: 30, expires_at: subDays(new Date(), -30).toISOString(), last_used_at: subDays(new Date(), 2).toISOString(), created_at: subDays(new Date(), 45).toISOString() },
    { id: 'ak-4', name: 'Legacy Connector (deprecated)', key_prefix: 'hh_live_oL5x', scopes: ['connectors.read'], status: 'revoked', rate_limit_per_minute: 60, expires_at: null, last_used_at: subDays(new Date(), 30).toISOString(), created_at: subDays(new Date(), 180).toISOString() },
    { id: 'ak-5', name: 'Dev/Test Key', key_prefix: 'hh_test_zQ8j', scopes: API_SCOPES.slice() as string[], status: 'active', rate_limit_per_minute: 10, expires_at: subDays(new Date(), -7).toISOString(), last_used_at: subHours(new Date(), 5).toISOString(), created_at: subDays(new Date(), 14).toISOString() },
  ];
}

function generateAuditLogs(keys: ApiKey[]): ApiAuditLog[] {
  const paths = ['/v1/reconciliations', '/v1/exceptions', '/v1/templates', '/v1/t2c/runs', '/v1/datasets/export/batch-123'];
  const methods = ['GET', 'GET', 'GET', 'POST', 'GET'];
  const logs: ApiAuditLog[] = [];
  for (let i = 0; i < 30; i++) {
    const key = keys[i % 3];
    logs.push({
      id: `log-${i}`,
      api_key_id: key.id,
      api_key_name: key.name,
      method: methods[i % methods.length],
      path: paths[i % paths.length],
      status_code: i % 7 === 0 ? 429 : (i % 11 === 0 ? 500 : 200),
      latency_ms: 20 + Math.floor(Math.random() * 300),
      ip_address: `192.168.${1 + (i % 5)}.${100 + i}`,
      idempotency_key: methods[i % methods.length] === 'POST' ? `idem-${i}` : null,
      created_at: subMinutes(new Date(), i * 12).toISOString(),
    });
  }
  return logs;
}

function generateWebhooks(): Webhook[] {
  return [
    { id: 'wh-1', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T00/B00/xxxx', events: ['exception.created', 'posting.failed'], status: 'active', retry_policy: { max_retries: 3, backoff_seconds: [10, 60, 300] }, created_at: subDays(new Date(), 60).toISOString(), updated_at: subDays(new Date(), 5).toISOString() },
    { id: 'wh-2', name: 'Data Lake Sync', url: 'https://lake.internal.corp/api/webhooks/arkheos', events: ['reconciliation.completed', 'dataset.imported'], status: 'active', retry_policy: { max_retries: 5, backoff_seconds: [10, 30, 120, 300, 900] }, created_at: subDays(new Date(), 45).toISOString(), updated_at: subDays(new Date(), 2).toISOString() },
    { id: 'wh-3', name: 'PagerDuty Alerts', url: 'https://events.pagerduty.com/integration/xxxx/enqueue', events: ['posting.failed', 'connector.run.failed', 'reconciliation.failed'], status: 'active', retry_policy: { max_retries: 3, backoff_seconds: [10, 60, 300] }, created_at: subDays(new Date(), 30).toISOString(), updated_at: subDays(new Date(), 10).toISOString() },
    { id: 'wh-4', name: 'Legacy BI Endpoint', url: 'https://old-bi.corp/webhook', events: ['reconciliation.completed'], status: 'disabled', retry_policy: { max_retries: 2, backoff_seconds: [30, 120] }, created_at: subDays(new Date(), 120).toISOString(), updated_at: subDays(new Date(), 60).toISOString() },
  ];
}

function generateDeliveries(webhooks: Webhook[]): WebhookDelivery[] {
  const deliveries: WebhookDelivery[] = [];
  const events = ['reconciliation.completed', 'exception.created', 'posting.failed', 'dataset.imported'];
  const statuses: DeliveryStatus[] = ['delivered', 'delivered', 'delivered', 'failed', 'retrying'];
  for (let i = 0; i < 25; i++) {
    const wh = webhooks[i % 3];
    const status = statuses[i % statuses.length];
    deliveries.push({
      id: `del-${i}`,
      webhook_id: wh.id,
      event_type: events[i % events.length],
      status,
      attempts: status === 'delivered' ? 1 : (status === 'retrying' ? 2 : 3),
      response_status: status === 'delivered' ? 200 : (status === 'failed' ? 500 : null),
      error_message: status === 'failed' ? 'Connection refused' : null,
      created_at: subMinutes(new Date(), i * 25).toISOString(),
    });
  }
  return deliveries;
}

export function useDeveloperPlatform() {
  const [apiKeys] = useState(() => generateApiKeys());
  const [auditLogs] = useState(() => generateAuditLogs(apiKeys));
  const [webhooks] = useState(() => generateWebhooks());
  const [deliveries] = useState(() => generateDeliveries(webhooks));
  const [activeTab, setActiveTab] = useState<string>('keys');

  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const errors = auditLogs.filter(l => l.status_code >= 400).length;
    const avgLatency = Math.round(auditLogs.reduce((s, l) => s + l.latency_ms, 0) / total);
    return { total, errors, avgLatency, errorRate: Math.round((errors / total) * 100) };
  }, [auditLogs]);

  const deliveryStats = useMemo(() => {
    const total = deliveries.length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    return { total, delivered, failed, successRate: Math.round((delivered / total) * 100) };
  }, [deliveries]);

  return {
    apiKeys, auditLogs, webhooks, deliveries,
    auditStats, deliveryStats,
    activeTab, setActiveTab,
  };
}

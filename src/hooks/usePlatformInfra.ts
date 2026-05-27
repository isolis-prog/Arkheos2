import { useState, useMemo } from 'react';

export interface BackgroundJob {
  id: string;
  job_type: string;
  domain: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'stale';
  progress: number;
  correlation_id: string;
  payload_summary: string;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface DomainEventSummary {
  id: string;
  event_type: string;
  domain: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  correlation_id: string;
  created_at: string;
  processed_at?: string;
}

const DEMO_JOBS: BackgroundJob[] = [
  { id: 'job-001', job_type: 'erp_sync', domain: 'connectors', priority: 'high', status: 'completed', progress: 100, correlation_id: 'c1a2b3c4', payload_summary: 'NetSuite full sync — 1,247 records', scheduled_at: '2026-02-15T08:00:00Z', started_at: '2026-02-15T08:00:12Z', completed_at: '2026-02-15T08:03:45Z', duration_ms: 213000 },
  { id: 'job-002', job_type: 'heavy_matching', domain: 'reconciliations', priority: 'critical', status: 'running', progress: 67, correlation_id: 'd4e5f6a7', payload_summary: 'ETRM↔ERP Fees recon — 3,402 pairs', scheduled_at: '2026-02-15T09:00:00Z', started_at: '2026-02-15T09:00:05Z' },
  { id: 'job-003', job_type: 'posting_batch', domain: 't2c', priority: 'high', status: 'completed', progress: 100, correlation_id: 'b8c9d0e1', payload_summary: 'T2C batch posting — 89 journal entries', scheduled_at: '2026-02-15T07:30:00Z', started_at: '2026-02-15T07:30:02Z', completed_at: '2026-02-15T07:31:15Z', duration_ms: 73000 },
  { id: 'job-004', job_type: 'anomaly_scan', domain: 'analytics', priority: 'normal', status: 'queued', progress: 0, correlation_id: 'f2a3b4c5', payload_summary: 'Daily anomaly detection scan', scheduled_at: '2026-02-15T10:00:00Z' },
  { id: 'job-005', job_type: 'data_retention', domain: 'platform', priority: 'low', status: 'completed', progress: 100, correlation_id: 'a6b7c8d9', payload_summary: 'Archive & purge records older than 365d', scheduled_at: '2026-02-15T02:00:00Z', started_at: '2026-02-15T02:00:01Z', completed_at: '2026-02-15T02:12:33Z', duration_ms: 752000 },
  { id: 'job-006', job_type: 'logistics_recon', domain: 'logistics', priority: 'normal', status: 'failed', progress: 42, correlation_id: 'e0f1a2b3', payload_summary: 'Movement vs Invoice reconciliation', scheduled_at: '2026-02-15T06:00:00Z', started_at: '2026-02-15T06:00:03Z', completed_at: '2026-02-15T06:02:18Z', duration_ms: 135000, error_message: 'Timeout: UOM conversion service unavailable' },
];

const DEMO_EVENTS: DomainEventSummary[] = [
  { id: 'ev-001', event_type: 'reconciliation.run.completed', domain: 'reconciliations', status: 'completed', correlation_id: 'd4e5f6a7', created_at: '2026-02-15T09:05:00Z', processed_at: '2026-02-15T09:05:02Z' },
  { id: 'ev-002', event_type: 'exception.created', domain: 'exceptions', status: 'completed', correlation_id: 'd4e5f6a7', created_at: '2026-02-15T09:05:03Z', processed_at: '2026-02-15T09:05:04Z' },
  { id: 'ev-003', event_type: 'posting.completed', domain: 't2c', status: 'completed', correlation_id: 'b8c9d0e1', created_at: '2026-02-15T07:31:15Z', processed_at: '2026-02-15T07:31:16Z' },
  { id: 'ev-004', event_type: 'connector.sync.completed', domain: 'connectors', status: 'completed', correlation_id: 'c1a2b3c4', created_at: '2026-02-15T08:03:45Z', processed_at: '2026-02-15T08:03:46Z' },
  { id: 'ev-005', event_type: 'anomaly.detected', domain: 'analytics', status: 'pending', correlation_id: 'f2a3b4c5', created_at: '2026-02-15T10:00:00Z' },
  { id: 'ev-006', event_type: 'movement.completed', domain: 'logistics', status: 'completed', correlation_id: 'x1y2z3w4', created_at: '2026-02-15T05:30:00Z', processed_at: '2026-02-15T05:30:01Z' },
  { id: 'ev-007', event_type: 'posting.failed', domain: 't2c', status: 'failed', correlation_id: 'e0f1a2b3', created_at: '2026-02-15T06:02:18Z', processed_at: '2026-02-15T06:02:19Z' },
  { id: 'ev-008', event_type: 'alert.triggered', domain: 'analytics', status: 'completed', correlation_id: 'q9r8s7t6', created_at: '2026-02-15T08:15:00Z', processed_at: '2026-02-15T08:15:01Z' },
];

export const usePlatformInfra = () => {
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const filteredJobs = useMemo(() => {
    if (jobFilter === 'all') return DEMO_JOBS;
    return DEMO_JOBS.filter(j => j.status === jobFilter);
  }, [jobFilter]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return DEMO_EVENTS;
    return DEMO_EVENTS.filter(e => e.status === eventFilter);
  }, [eventFilter]);

  const jobStats = useMemo(() => ({
    total: DEMO_JOBS.length,
    running: DEMO_JOBS.filter(j => j.status === 'running').length,
    queued: DEMO_JOBS.filter(j => j.status === 'queued').length,
    completed: DEMO_JOBS.filter(j => j.status === 'completed').length,
    failed: DEMO_JOBS.filter(j => j.status === 'failed').length,
    avgDuration: Math.round(
      DEMO_JOBS.filter(j => j.duration_ms).reduce((s, j) => s + (j.duration_ms ?? 0), 0) /
      Math.max(DEMO_JOBS.filter(j => j.duration_ms).length, 1) / 1000
    ),
  }), []);

  const eventStats = useMemo(() => ({
    total: DEMO_EVENTS.length,
    completed: DEMO_EVENTS.filter(e => e.status === 'completed').length,
    pending: DEMO_EVENTS.filter(e => e.status === 'pending').length,
    failed: DEMO_EVENTS.filter(e => e.status === 'failed').length,
  }), []);

  return {
    jobs: filteredJobs,
    events: filteredEvents,
    jobStats,
    eventStats,
    jobFilter, setJobFilter,
    eventFilter, setEventFilter,
  };
};

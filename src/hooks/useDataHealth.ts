import { useState, useMemo } from 'react';

export interface DQRule {
  id: string;
  ruleName: string;
  entityType: string;
  sourceSystem: string;
  checkType: string;
  fieldName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
}

export interface DQCheckRun {
  id: string;
  runType: 'scheduled' | 'manual' | 'triggered';
  sourceSystem: string;
  startedAt: string;
  completedAt: string | null;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  status: 'running' | 'completed' | 'failed';
}

export interface DQIssue {
  id: string;
  runId: string;
  ruleId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  issueType: 'missing' | 'invalid' | 'duplicate' | 'stale' | 'orphan' | 'mismatch';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'ignored';
  createdAt: string;
}

export interface DQScore {
  id: string;
  sourceSystem: string;
  dimension: string;
  score: number;
  recordsChecked: number;
  recordsPassed: number;
  measuredAt: string;
}

const demoRules: DQRule[] = [
  { id: 'DQR-001', ruleName: 'Counterparty LEI Required', entityType: 'counterparty', sourceSystem: 'etrm', checkType: 'completeness', fieldName: 'lei_code', severity: 'high', isActive: true },
  { id: 'DQR-002', ruleName: 'Location ISO Code Valid', entityType: 'location', sourceSystem: 'ops', checkType: 'validity', fieldName: 'iso_code', severity: 'medium', isActive: true },
  { id: 'DQR-003', ruleName: 'No Duplicate Counterparties', entityType: 'counterparty', sourceSystem: 'etrm', checkType: 'uniqueness', fieldName: 'name', severity: 'high', isActive: true },
  { id: 'DQR-004', ruleName: 'UoM Standard Mapping Exists', entityType: 'uom', sourceSystem: 'erp', checkType: 'referential', fieldName: 'standard_uom', severity: 'critical', isActive: true },
  { id: 'DQR-005', ruleName: 'Calendar Holidays Up-to-date', entityType: 'calendar', sourceSystem: 'market_data', checkType: 'timeliness', fieldName: 'last_updated', severity: 'medium', isActive: true },
  { id: 'DQR-006', ruleName: 'Account Code Format', entityType: 'account', sourceSystem: 'erp', checkType: 'validity', fieldName: 'gl_code', severity: 'high', isActive: true },
  { id: 'DQR-007', ruleName: 'Instrument ISIN Present', entityType: 'instrument', sourceSystem: 'etrm', checkType: 'completeness', fieldName: 'isin', severity: 'medium', isActive: false },
  { id: 'DQR-008', ruleName: 'ERP-ETRM Counterparty Match', entityType: 'counterparty', sourceSystem: 'erp', checkType: 'consistency', fieldName: 'counterparty_id', severity: 'critical', isActive: true },
];

const demoRuns: DQCheckRun[] = [
  { id: 'RUN-101', runType: 'scheduled', sourceSystem: 'etrm', startedAt: '2025-02-20T06:00:00Z', completedAt: '2025-02-20T06:04:12Z', totalChecks: 1240, passed: 1158, failed: 62, warnings: 20, status: 'completed' },
  { id: 'RUN-102', runType: 'scheduled', sourceSystem: 'erp', startedAt: '2025-02-20T06:00:00Z', completedAt: '2025-02-20T06:03:45Z', totalChecks: 890, passed: 841, failed: 34, warnings: 15, status: 'completed' },
  { id: 'RUN-103', runType: 'manual', sourceSystem: 'ops', startedAt: '2025-02-19T14:30:00Z', completedAt: '2025-02-19T14:32:10Z', totalChecks: 560, passed: 538, failed: 14, warnings: 8, status: 'completed' },
  { id: 'RUN-104', runType: 'scheduled', sourceSystem: 'market_data', startedAt: '2025-02-20T06:00:00Z', completedAt: null, totalChecks: 320, passed: 0, failed: 0, warnings: 0, status: 'running' },
];

const demoIssues: DQIssue[] = [
  { id: 'DQI-001', runId: 'RUN-101', ruleId: 'DQR-001', entityType: 'counterparty', entityId: 'CP-4421', fieldName: 'lei_code', issueType: 'missing', description: 'LEI code missing for counterparty "Mercuria Energy"', severity: 'high', status: 'open', createdAt: '2025-02-20' },
  { id: 'DQI-002', runId: 'RUN-101', ruleId: 'DQR-003', entityType: 'counterparty', entityId: 'CP-4455', fieldName: 'name', issueType: 'duplicate', description: 'Duplicate counterparty: "Glencore" and "GLENCORE INTL"', severity: 'high', status: 'assigned', createdAt: '2025-02-20' },
  { id: 'DQI-003', runId: 'RUN-101', ruleId: 'DQR-008', entityType: 'counterparty', entityId: 'CP-3301', fieldName: 'counterparty_id', issueType: 'mismatch', description: 'ETRM counterparty "Shell" maps to 2 different ERP vendor codes', severity: 'critical', status: 'in_progress', createdAt: '2025-02-20' },
  { id: 'DQI-004', runId: 'RUN-102', ruleId: 'DQR-004', entityType: 'uom', entityId: 'UOM-BBL', fieldName: 'standard_uom', issueType: 'orphan', description: 'ERP UoM "BBLS" has no mapping to standard "bbl"', severity: 'critical', status: 'open', createdAt: '2025-02-20' },
  { id: 'DQI-005', runId: 'RUN-102', ruleId: 'DQR-006', entityType: 'account', entityId: 'ACC-9912', fieldName: 'gl_code', issueType: 'invalid', description: 'GL code "99-XXXX-00" does not match format pattern', severity: 'high', status: 'open', createdAt: '2025-02-20' },
  { id: 'DQI-006', runId: 'RUN-103', ruleId: 'DQR-002', entityType: 'location', entityId: 'LOC-FUJ', fieldName: 'iso_code', issueType: 'invalid', description: 'Location "Fujairah Tank Farm" has non-standard ISO code', severity: 'medium', status: 'resolved', createdAt: '2025-02-19' },
  { id: 'DQI-007', runId: 'RUN-101', ruleId: 'DQR-005', entityType: 'calendar', entityId: 'CAL-SGX', fieldName: 'last_updated', issueType: 'stale', description: 'SGX holiday calendar not updated since 2024-11-01', severity: 'medium', status: 'open', createdAt: '2025-02-20' },
  { id: 'DQI-008', runId: 'RUN-101', ruleId: 'DQR-001', entityType: 'counterparty', entityId: 'CP-4490', fieldName: 'lei_code', issueType: 'missing', description: 'LEI code missing for counterparty "Vitol SA"', severity: 'high', status: 'open', createdAt: '2025-02-20' },
];

const demoScores: DQScore[] = [
  { id: 'S-01', sourceSystem: 'etrm', dimension: 'completeness', score: 91, recordsChecked: 450, recordsPassed: 410, measuredAt: '2025-02-20' },
  { id: 'S-02', sourceSystem: 'etrm', dimension: 'validity', score: 96, recordsChecked: 450, recordsPassed: 432, measuredAt: '2025-02-20' },
  { id: 'S-03', sourceSystem: 'etrm', dimension: 'timeliness', score: 88, recordsChecked: 340, recordsPassed: 299, measuredAt: '2025-02-20' },
  { id: 'S-04', sourceSystem: 'etrm', dimension: 'consistency', score: 84, recordsChecked: 450, recordsPassed: 378, measuredAt: '2025-02-20' },
  { id: 'S-05', sourceSystem: 'erp', dimension: 'completeness', score: 94, recordsChecked: 380, recordsPassed: 357, measuredAt: '2025-02-20' },
  { id: 'S-06', sourceSystem: 'erp', dimension: 'validity', score: 89, recordsChecked: 380, recordsPassed: 338, measuredAt: '2025-02-20' },
  { id: 'S-07', sourceSystem: 'erp', dimension: 'uniqueness', score: 97, recordsChecked: 380, recordsPassed: 369, measuredAt: '2025-02-20' },
  { id: 'S-08', sourceSystem: 'erp', dimension: 'consistency', score: 82, recordsChecked: 380, recordsPassed: 312, measuredAt: '2025-02-20' },
  { id: 'S-09', sourceSystem: 'ops', dimension: 'completeness', score: 87, recordsChecked: 260, recordsPassed: 226, measuredAt: '2025-02-19' },
  { id: 'S-10', sourceSystem: 'ops', dimension: 'validity', score: 93, recordsChecked: 260, recordsPassed: 242, measuredAt: '2025-02-19' },
  { id: 'S-11', sourceSystem: 'ops', dimension: 'timeliness', score: 79, recordsChecked: 260, recordsPassed: 205, measuredAt: '2025-02-19' },
  { id: 'S-12', sourceSystem: 'market_data', dimension: 'timeliness', score: 72, recordsChecked: 180, recordsPassed: 130, measuredAt: '2025-02-20' },
  { id: 'S-13', sourceSystem: 'market_data', dimension: 'validity', score: 98, recordsChecked: 180, recordsPassed: 176, measuredAt: '2025-02-20' },
];

export const useDataHealth = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredIssues = useMemo(() => {
    return demoIssues.filter(i => {
      const matchesSearch = !searchTerm || i.description.toLowerCase().includes(searchTerm.toLowerCase()) || i.entityId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [searchTerm, severityFilter]);

  const filteredScores = useMemo(() => {
    if (sourceFilter === 'all') return demoScores;
    return demoScores.filter(s => s.sourceSystem === sourceFilter);
  }, [sourceFilter]);

  // Aggregate scores per source
  const sourceHealthMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    demoScores.forEach(s => {
      if (!map[s.sourceSystem]) map[s.sourceSystem] = { total: 0, count: 0 };
      map[s.sourceSystem].total += s.score;
      map[s.sourceSystem].count += 1;
    });
    return Object.entries(map).map(([source, { total, count }]) => ({
      source,
      avgScore: Math.round(total / count),
    }));
  }, []);

  const overallScore = Math.round(demoScores.reduce((s, d) => s + d.score, 0) / demoScores.length);
  const openIssues = demoIssues.filter(i => i.status !== 'resolved' && i.status !== 'ignored').length;
  const criticalIssues = demoIssues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const topRootCause = 'missing';

  return {
    rules: demoRules,
    runs: demoRuns,
    issues: filteredIssues,
    scores: filteredScores,
    sourceHealth: sourceHealthMap,
    searchTerm, setSearchTerm,
    sourceFilter, setSourceFilter,
    severityFilter, setSeverityFilter,
    activeTab, setActiveTab,
    kpis: { overallScore, openIssues, criticalIssues, topRootCause, totalRules: demoRules.filter(r => r.isActive).length },
  };
};

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, subDays, format, startOfMonth, endOfMonth, addMonths, subMonths, startOfQuarter, endOfQuarter, differenceInDays } from 'date-fns';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

// ── Types ───────────────────────────────────────────────────────────────────
export type FilingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'SUBMITTED' | 'OVERDUE' | 'WAIVED';
export type SubmissionStatus = 'QUEUED' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED' | 'LATE' | 'SUPERSEDED';
export type ValidationSeverity = 'PASS' | 'WARNING' | 'ERROR';
export type Agency = 'CFTC' | 'FERC' | 'EIA';

export interface FilingObligation {
  id: string;
  filingName: string;
  agency: Agency;
  reportType: string;
  frequency: string;
  dueDescription: string;
  applicable: 'YES' | 'NO' | 'CONDITIONAL';
  outputFormat: string;
  submissionMethod: string;
}

export interface CalendarEvent {
  id: string;
  obligationId: string;
  filingName: string;
  agency: Agency;
  dueDate: string;
  periodCoveredStart: string;
  periodCoveredEnd: string;
  status: FilingStatus;
  assignedOwner: string;
  notes: string;
}

export interface RegReport {
  id: string;
  calendarEventId: string;
  reportType: string;
  agency: Agency;
  periodStart: string;
  periodEnd: string;
  outputFormat: string;
  generatedBy: string;
  generatedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  status: string;
  validationStatus: string;
  validationErrors: number;
  validationWarnings: number;
  validationResults: ValidationResult[];
  dataSnapshot: Record<string, unknown>;
}

export interface ValidationResult {
  ruleId: string;
  field: string;
  severity: ValidationSeverity;
  description: string;
  suggestedFix: string;
  status: 'Pass' | 'Warn' | 'Fail';
}

export interface Submission {
  id: string;
  reportId: string;
  reportName: string;
  agency: Agency;
  period: string;
  submissionDate: string | null;
  submittedBy: string;
  submissionMethod: string;
  status: SubmissionStatus;
  confirmationNumber: string | null;
  rejectionReason: string | null;
  notes: { text: string; author: string; date: string }[];
  isCorrection: boolean;
  originalSubmissionId: string | null;
}

export interface RegulatoryProfile {
  legalEntityName: string;
  lei: string;
  fercCompanyId: string;
  dunsNumber: string;
  cftcRegistrantId: string;
  eiaRespondentId: string;
  sdrSelection: string;
  usiNamespacePrefix: string;
  primaryComplianceOfficer: string;
  regulatoryCounselName: string;
  regulatoryCounselEmail: string;
  isComplete: boolean;
}

// ── Filing obligations library ──────────────────────────────────────────────
const FILING_LIBRARY: FilingObligation[] = [
  { id: 'cftc-swap-rt', filingName: 'Swap Trade Reporting (Real-Time)', agency: 'CFTC', reportType: 'DODD_FRANK_SWAP', frequency: 'Daily (Continuous)', dueDescription: 'Real-time upon execution', applicable: 'YES', outputFormat: 'FpML XML / CSV', submissionMethod: 'SDR Portal' },
  { id: 'cftc-form-102', filingName: 'Large Trader Report Form 102', agency: 'CFTC', reportType: 'CFTC_FORM_102', frequency: 'Conditional', dueDescription: 'When position exceeds reporting threshold', applicable: 'CONDITIONAL', outputFormat: 'XML', submissionMethod: 'CFTC eFiling' },
  { id: 'cftc-form-40', filingName: 'Statement of Reporting Trader Form 40', agency: 'CFTC', reportType: 'CFTC_FORM_40', frequency: 'Annual', dueDescription: 'Within 30 days of triggering threshold', applicable: 'CONDITIONAL', outputFormat: 'XML', submissionMethod: 'CFTC eFiling' },
  { id: 'cftc-form-102s', filingName: 'Ownership and Control Report Form 102S', agency: 'CFTC', reportType: 'CFTC_FORM_102S', frequency: 'As applicable', dueDescription: 'Upon request or trigger', applicable: 'CONDITIONAL', outputFormat: 'XML', submissionMethod: 'CFTC eFiling' },
  { id: 'cftc-arlt', filingName: 'Annual Report of Large Traders (ARLT)', agency: 'CFTC', reportType: 'CFTC_ARLT', frequency: 'Annual', dueDescription: 'Annual filing', applicable: 'CONDITIONAL', outputFormat: 'XML', submissionMethod: 'CFTC eFiling' },
  { id: 'ferc-eqr', filingName: 'Electric Quarterly Report (EQR)', agency: 'FERC', reportType: 'FERC_EQR', frequency: 'Quarterly', dueDescription: 'Q1→Apr 30 | Q2→Jul 31 | Q3→Oct 31 | Q4→Jan 31', applicable: 'YES', outputFormat: 'CSV (Contract + Transaction)', submissionMethod: 'FERC eFiling' },
  { id: 'ferc-form-552', filingName: 'Form 552 Natural Gas Transactions', agency: 'FERC', reportType: 'FERC_FORM_552', frequency: 'Annual', dueDescription: 'Due April 30', applicable: 'YES', outputFormat: 'XML', submissionMethod: 'FERC eFiling' },
  { id: 'ferc-form-60', filingName: 'FERC Form 60 (Centralized Service Co.)', agency: 'FERC', reportType: 'FERC_FORM_60', frequency: 'Annual', dueDescription: 'Annual filing (if applicable)', applicable: 'CONDITIONAL', outputFormat: 'XML', submissionMethod: 'FERC eFiling' },
  { id: 'ferc-snapshot', filingName: 'Electric Market Snapshot', agency: 'FERC', reportType: 'FERC_SNAPSHOT', frequency: 'Monthly', dueDescription: 'Informational — monthly', applicable: 'YES', outputFormat: 'CSV', submissionMethod: 'Email / Portal' },
  { id: 'eia-914', filingName: 'Form EIA-914 Natural Gas Production', agency: 'EIA', reportType: 'EIA_914', frequency: 'Monthly', dueDescription: 'Last day of following month', applicable: 'CONDITIONAL', outputFormat: 'XLSX', submissionMethod: 'EIA Portal' },
  { id: 'eia-182', filingName: 'Form EIA-182 Domestic Crude Oil', agency: 'EIA', reportType: 'EIA_182', frequency: 'Monthly', dueDescription: 'Monthly', applicable: 'CONDITIONAL', outputFormat: 'XLSX', submissionMethod: 'EIA Portal' },
  { id: 'eia-64a', filingName: 'Form EIA-64A Annual Electric Power', agency: 'EIA', reportType: 'EIA_64A', frequency: 'Annual', dueDescription: 'Annual filing', applicable: 'CONDITIONAL', outputFormat: 'XLSX', submissionMethod: 'EIA Portal' },
];

// ── Demo data generators ─────────────────────────────────────────────────────
function generateCalendarEvents(): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];
  const owners = ['Sarah Chen', 'Mike Rodriguez', 'Lisa Park', 'James Wilson'];
  const statuses: FilingStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'SUBMITTED', 'OVERDUE', 'WAIVED'];

  // Generate events for past 3 months and next 3 months
  for (let m = -3; m <= 3; m++) {
    const month = addMonths(now, m);
    // Monthly filings
    ['ferc-snapshot', 'eia-914', 'eia-182'].forEach((oblId, idx) => {
      const obl = FILING_LIBRARY.find(f => f.id === oblId)!;
      const due = endOfMonth(month);
      const isPast = due < now;
      events.push({
        id: `cal-${oblId}-${format(month, 'yyyy-MM')}`,
        obligationId: oblId,
        filingName: obl.filingName,
        agency: obl.agency,
        dueDate: format(due, 'yyyy-MM-dd'),
        periodCoveredStart: format(startOfMonth(month), 'yyyy-MM-dd'),
        periodCoveredEnd: format(endOfMonth(month), 'yyyy-MM-dd'),
        status: isPast ? (idx === 0 ? 'SUBMITTED' : idx === 1 ? 'SUBMITTED' : 'WAIVED') : (m === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        assignedOwner: owners[idx % owners.length],
        notes: '',
      });
    });
  }

  // Quarterly filings (FERC EQR)
  for (let q = -2; q <= 2; q++) {
    const qStart = startOfQuarter(addMonths(now, q * 3));
    const qEnd = endOfQuarter(addMonths(now, q * 3));
    const qNum = Math.ceil((qStart.getMonth() + 1) / 3);
    const dueDates: Record<number, string> = { 1: '-04-30', 2: '-07-31', 3: '-10-31', 4: '-01-31' };
    const yr = qNum === 4 ? qStart.getFullYear() + 1 : qStart.getFullYear();
    const dueStr = `${yr}${dueDates[qNum]}`;
    const due = new Date(dueStr);
    const isPast = due < now;
    events.push({
      id: `cal-ferc-eqr-Q${qNum}-${qStart.getFullYear()}`,
      obligationId: 'ferc-eqr',
      filingName: `Electric Quarterly Report (EQR) — Q${qNum} ${qStart.getFullYear()}`,
      agency: 'FERC',
      dueDate: dueStr,
      periodCoveredStart: format(qStart, 'yyyy-MM-dd'),
      periodCoveredEnd: format(qEnd, 'yyyy-MM-dd'),
      status: isPast ? 'SUBMITTED' : q === 0 ? 'READY_FOR_REVIEW' : 'NOT_STARTED',
      assignedOwner: 'Lisa Park',
      notes: '',
    });
  }

  // CFTC Swap daily
  for (let d = -5; d <= 5; d++) {
    const day = addDays(now, d);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    events.push({
      id: `cal-cftc-swap-${format(day, 'yyyy-MM-dd')}`,
      obligationId: 'cftc-swap-rt',
      filingName: 'Swap Trade Reporting (Real-Time)',
      agency: 'CFTC',
      dueDate: format(day, 'yyyy-MM-dd'),
      periodCoveredStart: format(day, 'yyyy-MM-dd'),
      periodCoveredEnd: format(day, 'yyyy-MM-dd'),
      status: d < 0 ? 'SUBMITTED' : d === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      assignedOwner: 'Sarah Chen',
      notes: '',
    });
  }

  // Annual filings
  ['ferc-form-552', 'cftc-arlt'].forEach((oblId, idx) => {
    const obl = FILING_LIBRARY.find(f => f.id === oblId)!;
    events.push({
      id: `cal-${oblId}-${now.getFullYear()}`,
      obligationId: oblId,
      filingName: obl.filingName,
      agency: obl.agency,
      dueDate: `${now.getFullYear()}-04-30`,
      periodCoveredStart: `${now.getFullYear() - 1}-01-01`,
      periodCoveredEnd: `${now.getFullYear() - 1}-12-31`,
      status: now.getMonth() >= 4 ? 'SUBMITTED' : 'IN_PROGRESS',
      assignedOwner: owners[idx + 1],
      notes: '',
    });
  });

  return events;
}

function generateSubmissions(): Submission[] {
  const now = new Date();
  return [
    {
      id: 'sub-001', reportId: 'rpt-001', reportName: 'FERC EQR — Q4 2025', agency: 'FERC',
      period: 'Q4 2025', submissionDate: format(subDays(now, 45), 'yyyy-MM-dd HH:mm:ss'),
      submittedBy: 'Lisa Park', submissionMethod: 'FERC eFiling Portal',
      status: 'CONFIRMED', confirmationNumber: 'FERC-2026-EQR-004521', rejectionReason: null,
      notes: [{ text: 'Submitted on time', author: 'Lisa Park', date: format(subDays(now, 45), 'yyyy-MM-dd') }],
      isCorrection: false, originalSubmissionId: null,
    },
    {
      id: 'sub-002', reportId: 'rpt-002', reportName: 'Swap Trade Report — 2026-03-15', agency: 'CFTC',
      period: '2026-03-15', submissionDate: format(subDays(now, 8), 'yyyy-MM-dd HH:mm:ss'),
      submittedBy: 'Sarah Chen', submissionMethod: 'DTCC SDR Portal',
      status: 'CONFIRMED', confirmationNumber: 'DTCC-SDR-20260315-8823', rejectionReason: null,
      notes: [{ text: '3 swap trades reported', author: 'Sarah Chen', date: format(subDays(now, 8), 'yyyy-MM-dd') }],
      isCorrection: false, originalSubmissionId: null,
    },
    {
      id: 'sub-003', reportId: 'rpt-003', reportName: 'EIA-914 — Feb 2026', agency: 'EIA',
      period: 'Feb 2026', submissionDate: format(subDays(now, 5), 'yyyy-MM-dd HH:mm:ss'),
      submittedBy: 'Mike Rodriguez', submissionMethod: 'EIA Portal',
      status: 'REJECTED', confirmationNumber: null, rejectionReason: 'Volume totals do not match state breakdown. Resubmit with corrected state-level data.',
      notes: [
        { text: 'Submitted with auto-populated volumes', author: 'Mike Rodriguez', date: format(subDays(now, 5), 'yyyy-MM-dd') },
        { text: 'Rejected — need to review Permian Basin volumes', author: 'Mike Rodriguez', date: format(subDays(now, 3), 'yyyy-MM-dd') },
      ],
      isCorrection: false, originalSubmissionId: null,
    },
    {
      id: 'sub-004', reportId: 'rpt-004', reportName: 'Swap Trade Report — 2026-03-20', agency: 'CFTC',
      period: '2026-03-20', submissionDate: null,
      submittedBy: '', submissionMethod: 'DTCC SDR Portal',
      status: 'QUEUED', confirmationNumber: null, rejectionReason: null,
      notes: [], isCorrection: false, originalSubmissionId: null,
    },
    {
      id: 'sub-005', reportId: 'rpt-005', reportName: 'FERC EQR — Q1 2026', agency: 'FERC',
      period: 'Q1 2026', submissionDate: null,
      submittedBy: '', submissionMethod: 'FERC eFiling Portal',
      status: 'QUEUED', confirmationNumber: null, rejectionReason: null,
      notes: [], isCorrection: false, originalSubmissionId: null,
    },
    {
      id: 'sub-006', reportId: 'rpt-006', reportName: 'FERC EQR — Q3 2025', agency: 'FERC',
      period: 'Q3 2025', submissionDate: format(subDays(now, 140), 'yyyy-MM-dd HH:mm:ss'),
      submittedBy: 'Lisa Park', submissionMethod: 'FERC eFiling Portal',
      status: 'LATE', confirmationNumber: 'FERC-2025-EQR-003218', rejectionReason: null,
      notes: [{ text: 'Submitted 3 days after deadline', author: 'Lisa Park', date: format(subDays(now, 140), 'yyyy-MM-dd') }],
      isCorrection: false, originalSubmissionId: null,
    },
  ];
}

function generateValidationResults(reportType: string): ValidationResult[] {
  const base: ValidationResult[] = [
    { ruleId: 'COMP-001', field: 'LEI', severity: 'PASS', description: 'Reporting entity LEI is populated and valid format (20-char ISO 17442)', suggestedFix: '', status: 'Pass' },
    { ruleId: 'COMP-002', field: 'trade_id', severity: 'PASS', description: 'All trades in reporting period are included', suggestedFix: '', status: 'Pass' },
    { ruleId: 'COMP-003', field: 'counterparty.LEI', severity: 'WARNING', description: '2 counterparties missing LEI — trades with Vitol SA and Gunvor Group', suggestedFix: 'Update counterparty registry with valid LEI for flagged entities', status: 'Warn' },
    { ruleId: 'CONS-001', field: 'volume', severity: 'PASS', description: 'Transaction volumes match trade quantities within ±0.01% tolerance', suggestedFix: '', status: 'Pass' },
    { ruleId: 'CONS-002', field: 'cash_amounts', severity: 'PASS', description: 'Cash amounts consistent with Invoicing/AR records within ±$0.01', suggestedFix: '', status: 'Pass' },
    { ruleId: 'CONS-003', field: 'delivery_period', severity: 'PASS', description: 'Delivery periods match Trade Lifecycle records', suggestedFix: '', status: 'Pass' },
    { ruleId: 'CONS-004', field: 'amendments', severity: 'PASS', description: 'Amended trades correctly supersede originals — latest version used', suggestedFix: '', status: 'Pass' },
    { ruleId: 'FMT-001', field: 'dates', severity: 'PASS', description: 'All date fields in correct format per agency specification', suggestedFix: '', status: 'Pass' },
    { ruleId: 'FMT-002', field: 'numeric_ranges', severity: 'PASS', description: 'No negative volumes or zero-price non-zero-volume transactions', suggestedFix: '', status: 'Pass' },
  ];

  if (reportType === 'FERC_EQR') {
    base.push(
      { ruleId: 'REG-FERC-001', field: 'ferc_company_id', severity: 'PASS', description: 'FERC Company IDs present for both seller and buyer', suggestedFix: '', status: 'Pass' },
      { ruleId: 'REG-FERC-002', field: 'contract_type', severity: 'PASS', description: 'Contract type classification consistent with delivery period length', suggestedFix: '', status: 'Pass' },
      { ruleId: 'REG-FERC-003', field: 'transactions', severity: 'PASS', description: 'Every contract has ≥1 transaction in transaction file', suggestedFix: '', status: 'Pass' },
      { ruleId: 'REG-FERC-004', field: 'currency', severity: 'PASS', description: 'All monetary values in USD', suggestedFix: '', status: 'Pass' },
    );
  } else if (reportType === 'DODD_FRANK_SWAP') {
    base.push(
      { ruleId: 'REG-CFTC-001', field: 'USI', severity: 'PASS', description: 'USI format valid (20-char alphanumeric, namespace prefix matches tenant config)', suggestedFix: '', status: 'Pass' },
      { ruleId: 'REG-CFTC-002', field: 'asset_class', severity: 'PASS', description: 'Asset class classification matches commodity type per CFTC taxonomy', suggestedFix: '', status: 'Pass' },
    );
  }

  return base;
}

// ── Demo Regulatory Profile ─────────────────────────────────────────────────
const DEMO_PROFILE: RegulatoryProfile = {
  legalEntityName: 'Arkhe Energy Trading LLC',
  lei: '549300EXAMPLE00LEI0X',
  fercCompanyId: 'C001234',
  dunsNumber: '123456789',
  cftcRegistrantId: 'CFTC-REG-00456',
  eiaRespondentId: 'EIA-R-7890',
  sdrSelection: 'DTCC',
  usiNamespacePrefix: 'ARKHE12345',
  primaryComplianceOfficer: 'James Wilson',
  regulatoryCounselName: 'Patterson & Associates LLP',
  regulatoryCounselEmail: 'compliance@pattersonllp.com',
  isComplete: true,
};

// ── Report types for builder ────────────────────────────────────────────────
export interface ReportTemplate {
  id: string;
  reportType: string;
  agency: Agency;
  name: string;
  description: string;
  outputFormats: string[];
  triggerType: 'AUTO' | 'MANUAL' | 'CONDITIONAL';
  dataSourceModules: string[];
  v2Placeholder?: boolean;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'tpl-swap', reportType: 'DODD_FRANK_SWAP', agency: 'CFTC', name: 'Dodd-Frank Swap Trade Report', description: 'Real-time swap trade reporting to SDR per Dodd-Frank Title VII', outputFormats: ['FpML XML', 'CSV'], triggerType: 'AUTO', dataSourceModules: ['Trade Lifecycle', 'Master Data'] },
  { id: 'tpl-102', reportType: 'CFTC_FORM_102', agency: 'CFTC', name: 'CFTC Form 102 — Large Trader Report', description: 'Position reporting when net position exceeds CFTC large trader threshold', outputFormats: ['XML'], triggerType: 'CONDITIONAL', dataSourceModules: ['Position & Risk', 'Trade Lifecycle', 'Master Data'] },
  { id: 'tpl-40', reportType: 'CFTC_FORM_40', agency: 'CFTC', name: 'CFTC Form 40 — Statement of Reporting Trader', description: 'Annual statement with classification fields requiring compliance review', outputFormats: ['XML'], triggerType: 'MANUAL', dataSourceModules: ['Trade Lifecycle', 'Master Data'] },
  { id: 'tpl-eqr', reportType: 'FERC_EQR', agency: 'FERC', name: 'FERC Electric Quarterly Report (EQR)', description: 'Quarterly contract + transaction files for FERC eFiling', outputFormats: ['CSV'], triggerType: 'MANUAL', dataSourceModules: ['Trade Lifecycle', 'Cashflows', 'Invoicing / AR'] },
  { id: 'tpl-552', reportType: 'FERC_FORM_552', agency: 'FERC', name: 'FERC Form 552 — Natural Gas Transactions', description: 'Annual natural gas purchase/sale contracts ≥30 days', outputFormats: ['XML'], triggerType: 'MANUAL', dataSourceModules: ['Trade Lifecycle', 'Cashflows'] },
  { id: 'tpl-914', reportType: 'EIA_914', agency: 'EIA', name: 'EIA Form 914 — Natural Gas Production', description: 'Monthly production report. Applicable only if company has production assets.', outputFormats: ['XLSX'], triggerType: 'MANUAL', dataSourceModules: ['Logistics / Operations'] },
];

const V2_PLACEHOLDERS: ReportTemplate[] = [
  { id: 'v2-sdr-api', reportType: 'SDR_API', agency: 'CFTC', name: 'Automated SDR API Submission', description: 'Direct API submission to DTCC/ICE/CME SDRs', outputFormats: [], triggerType: 'AUTO', dataSourceModules: [], v2Placeholder: true },
  { id: 'v2-ferc-api', reportType: 'FERC_API', agency: 'FERC', name: 'Automated FERC eFiling API', description: 'Direct API filing to FERC', outputFormats: [], triggerType: 'AUTO', dataSourceModules: [], v2Placeholder: true },
  { id: 'v2-state', reportType: 'STATE_REG', agency: 'CFTC', name: 'State-Level Regulatory Reporting', description: 'Texas RRC, California CPUC, and other state regulators', outputFormats: [], triggerType: 'MANUAL', dataSourceModules: [], v2Placeholder: true },
  { id: 'v2-emir', reportType: 'EMIR', agency: 'FERC', name: 'FCA / EMIR Reporting (UK/EU)', description: 'Out of scope for US module', outputFormats: [], triggerType: 'MANUAL', dataSourceModules: [], v2Placeholder: true },
  { id: 'v2-ai', reportType: 'AI_ANOMALY', agency: 'CFTC', name: 'AI-Assisted Anomaly Detection', description: 'AI-driven anomaly detection in report data', outputFormats: [], triggerType: 'AUTO', dataSourceModules: [], v2Placeholder: true },
];

// ── Main Hook ────────────────────────────────────────────────────────────────
export function useRegulatoryReporting() {
  const [calendarView, setCalendarView] = useState<'calendar' | 'list'>('list');
  const [agencyFilter, setAgencyFilter] = useState<Agency | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<RegReport | null>(null);

  const calendarEvents = useMemo(() => generateCalendarEvents(), []);
  const submissions = useMemo(() => generateSubmissions(), []);
  const profile = DEMO_PROFILE;

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(e => {
      if (agencyFilter !== 'ALL' && e.agency !== agencyFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      return true;
    });
  }, [calendarEvents, agencyFilter, statusFilter]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (agencyFilter !== 'ALL' && s.agency !== agencyFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [submissions, agencyFilter, statusFilter]);

  // Compliance dashboard stats
  const complianceStats = useMemo(() => {
    const now = new Date();
    const next30 = addDays(now, 30);
    const agencies: Agency[] = ['CFTC', 'FERC', 'EIA'];
    const agencyStats = agencies.map(agency => {
      const agencyEvents = calendarEvents.filter(e => e.agency === agency);
      const upcoming = agencyEvents.filter(e => {
        const d = new Date(e.dueDate);
        return d >= now && d <= next30 && e.status !== 'SUBMITTED' && e.status !== 'WAIVED';
      });
      const overdue = agencyEvents.filter(e => e.status === 'OVERDUE' || (new Date(e.dueDate) < now && e.status !== 'SUBMITTED' && e.status !== 'WAIVED'));
      const lastSubmission = submissions
        .filter(s => s.agency === agency && s.status === 'CONFIRMED')
        .sort((a, b) => (b.submissionDate || '').localeCompare(a.submissionDate || ''))[0];
      return {
        agency,
        activeObligations: agencyEvents.filter(e => e.status !== 'WAIVED').length,
        upcoming: upcoming.length,
        overdue: overdue.length,
        lastSubmissionDate: lastSubmission?.submissionDate?.split(' ')[0] || 'N/A',
        status: overdue.length > 0 ? 'CRITICAL' : upcoming.length > 3 ? 'WARNING' : 'OK',
      };
    });
    const totalSubmissionsYTD = submissions.filter(s => s.status === 'CONFIRMED' || s.status === 'LATE').length;
    const onTimeCount = submissions.filter(s => s.status === 'CONFIRMED').length;
    const rejectedCount = submissions.filter(s => s.status === 'REJECTED').length;
    const pendingCount = submissions.filter(s => s.status === 'QUEUED' || s.status === 'SUBMITTED').length;

    return {
      agencyStats,
      totalSubmissionsYTD,
      onTimeRate: totalSubmissionsYTD > 0 ? Math.round((onTimeCount / totalSubmissionsYTD) * 100) : 100,
      rejectedRate: totalSubmissionsYTD > 0 ? Math.round((rejectedCount / totalSubmissionsYTD) * 100) : 0,
      pendingConfirmations: pendingCount,
    };
  }, [calendarEvents, submissions]);

  // Upcoming deadlines (next 30 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const next30 = addDays(now, 30);
    return calendarEvents
      .filter(e => {
        const d = new Date(e.dueDate);
        return d >= now && d <= next30 && e.status !== 'SUBMITTED' && e.status !== 'WAIVED';
      })
      .map(e => ({
        ...e,
        daysRemaining: differenceInDays(new Date(e.dueDate), now),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [calendarEvents]);

  // Open issues
  const openIssues = useMemo(() => {
    const overdueEvents = calendarEvents.filter(e =>
      e.status === 'OVERDUE' || (new Date(e.dueDate) < new Date() && e.status !== 'SUBMITTED' && e.status !== 'WAIVED')
    );
    const rejectedSubs = submissions.filter(s => s.status === 'REJECTED');
    return { overdueEvents, rejectedSubs };
  }, [calendarEvents, submissions]);

  return {
    calendarView, setCalendarView,
    agencyFilter, setAgencyFilter,
    statusFilter, setStatusFilter,
    calendarEvents: filteredEvents,
    allCalendarEvents: calendarEvents,
    submissions: filteredSubmissions,
    allSubmissions: submissions,
    profile,
    filingLibrary: FILING_LIBRARY,
    reportTemplates: REPORT_TEMPLATES,
    v2Placeholders: V2_PLACEHOLDERS,
    complianceStats,
    upcomingDeadlines,
    openIssues,
    selectedReport, setSelectedReport,
    generateValidationResults,
  };
}

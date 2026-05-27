import { useState, useMemo } from 'react';
import { subDays, subHours, addDays } from 'date-fns';

export interface CoverageCell {
  row: string;
  col: string;
  coveragePct: number;
  total: number;
  covered: number;
  gaps: string[];
}

export interface CoverageHeatmap {
  category: string;
  title: string;
  rows: string[];
  cols: string[];
  cells: CoverageCell[];
  overallPct: number;
}

export interface MDMCoverageIssue {
  id: string;
  category: 'gl_mapping' | 'tax_code' | 'payment_terms' | 'location_alias';
  entityType: string;
  entityName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issueDescription: string;
  recommendedFix: string;
  impactedTrades: number;
  impactedAmount: number;
  status: 'open' | 'in_progress' | 'resolved' | 'waived';
  createdAt: string;
}

export interface MDMChangeRequest {
  id: string;
  requestType: 'new_mapping' | 'update_mapping' | 'new_entity' | 'deactivate';
  entityType: string;
  entityName: string;
  details: Record<string, string>;
  justification: string;
  requesterRole: string;
  requesterName: string;
  approverRole: string;
  approverName: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
  approvedAt: string | null;
}

const PRODUCTS = ['Crude WTI', 'Brent', 'RBOB Gasoline', 'Natural Gas', 'Heating Oil', 'Jet Fuel', 'Naphtha', 'LPG'];
const FEES = ['Brokerage', 'Storage', 'Transport', 'Insurance', 'Inspection', 'Demurrage', 'Pipeline'];
const JURISDICTIONS = ['US', 'UK', 'NL', 'SG', 'CH', 'BR', 'AE', 'JP'];
const INCOTERMS = ['FOB', 'CIF', 'CFR', 'DAP', 'DDP', 'EXW', 'FCA'];
const LOCATIONS = ['Houston TX', 'Rotterdam', 'Singapore', 'Fujairah', 'Cushing OK', 'Santos BR', 'Augusta IT'];

function generateHeatmaps(): CoverageHeatmap[] {
  const mkCells = (rows: string[], cols: string[]): CoverageCell[] =>
    rows.flatMap(r => cols.map(c => {
      const pct = 60 + Math.floor(Math.random() * 40);
      const total = 5 + Math.floor(Math.random() * 20);
      const covered = Math.floor(total * pct / 100);
      return { row: r, col: c, coveragePct: pct, total, covered, gaps: pct < 80 ? [`Missing ${c} mapping for ${r}`] : [] };
    }));

  const gl = mkCells(PRODUCTS, FEES);
  const tax = mkCells(JURISDICTIONS.slice(0, 5), INCOTERMS.slice(0, 5));
  const pay = mkCells(['Shell', 'BP', 'Vitol', 'Trafigura', 'Glencore'], ['Net Days', 'Currency', 'Bank Details', 'Netting']);
  const loc = mkCells(LOCATIONS.slice(0, 5), ['Canonical', 'ETRM Alias', 'ERP Alias', 'Ops Alias']);

  const avg = (cells: CoverageCell[]) => Math.round(cells.reduce((s, c) => s + c.coveragePct, 0) / cells.length);

  return [
    { category: 'gl_mapping', title: 'GL Mapping Coverage (Product × Fee)', rows: PRODUCTS, cols: FEES, cells: gl, overallPct: avg(gl) },
    { category: 'tax_code', title: 'Tax Code Coverage (Jurisdiction × Incoterm)', rows: JURISDICTIONS.slice(0, 5), cols: INCOTERMS.slice(0, 5), cells: tax, overallPct: avg(tax) },
    { category: 'payment_terms', title: 'Payment Terms Alignment (Counterparty × Field)', rows: ['Shell', 'BP', 'Vitol', 'Trafigura', 'Glencore'], cols: ['Net Days', 'Currency', 'Bank Details', 'Netting'], cells: pay, overallPct: avg(pay) },
    { category: 'location_alias', title: 'Location Alias Drift (Location × System)', rows: LOCATIONS.slice(0, 5), cols: ['Canonical', 'ETRM Alias', 'ERP Alias', 'Ops Alias'], cells: loc, overallPct: avg(loc) },
  ];
}

function generateIssues(): MDMCoverageIssue[] {
  const categories: MDMCoverageIssue['category'][] = ['gl_mapping', 'tax_code', 'payment_terms', 'location_alias'];
  const issues: MDMCoverageIssue[] = [];
  const descs: Record<string, string[]> = {
    gl_mapping: ['No GL account mapped for Naphtha/Brokerage', 'Missing GL for LPG/Demurrage', 'Stale GL mapping for Jet Fuel/Transport'],
    tax_code: ['No tax code for BR/DDP', 'Missing VAT rule for NL/CIF', 'Carbon levy not configured for UK/FOB'],
    payment_terms: ['Payment terms mismatch for Trafigura: ETRM=Net30, ERP=Net45', 'Missing bank details for Glencore in ERP', 'Netting flag inconsistent for BP'],
    location_alias: ['Duplicate: "Houston, TX" vs "Houston TX"', 'Near-duplicate: "Rotterdm" vs "Rotterdam"', 'Unmapped alias: "Sing" in Ops system'],
  };

  categories.forEach((cat, ci) => {
    descs[cat].forEach((desc, di) => {
      const sev: MDMCoverageIssue['severity'][] = ['critical', 'high', 'medium', 'low'];
      issues.push({
        id: `mdm-${ci}-${di}`,
        category: cat,
        entityType: cat === 'gl_mapping' ? 'product/fee' : cat === 'tax_code' ? 'jurisdiction' : cat === 'payment_terms' ? 'counterparty' : 'location',
        entityName: desc.split(' for ')[1]?.split(' ')[0] || desc.split(': ')[1]?.split(' ')[0] || 'Unknown',
        severity: sev[(ci + di) % 4],
        issueDescription: desc,
        recommendedFix: `Add or correct the ${cat.replace('_', ' ')} configuration`,
        impactedTrades: 10 + Math.floor(Math.random() * 200),
        impactedAmount: Math.round((50000 + Math.random() * 500000) * 100) / 100,
        status: di === 0 ? 'open' : di === 1 ? 'in_progress' : 'open',
        createdAt: subDays(new Date(), ci * 3 + di).toISOString(),
      });
    });
  });
  return issues;
}

function generateChangeRequests(): MDMChangeRequest[] {
  const requests: MDMChangeRequest[] = [
    { id: 'cr-1', requestType: 'new_mapping', entityType: 'product', entityName: 'Low Sulphur Fuel Oil', details: { gl_account: '4100-LSFO', commodity_group: 'Fuel Oil' }, justification: 'New product traded starting Q2', requesterRole: 'FO', requesterName: 'J. Smith', approverRole: 'BO', approverName: null, status: 'pending', createdAt: subDays(new Date(), 2).toISOString(), approvedAt: null },
    { id: 'cr-2', requestType: 'new_entity', entityType: 'counterparty', entityName: 'Petronas Trading', details: { lei: '549300ABCDEF', country: 'MY' }, justification: 'New trading relationship approved by credit', requesterRole: 'FO', requesterName: 'A. Chen', approverRole: 'MO', approverName: null, status: 'pending', createdAt: subDays(new Date(), 1).toISOString(), approvedAt: null },
    { id: 'cr-3', requestType: 'update_mapping', entityType: 'gl_account', entityName: 'Crude WTI / Brokerage', details: { old_gl: '4100-BRK', new_gl: '4150-BRK' }, justification: 'GL restructuring per accounting memo #2026-34', requesterRole: 'BO', requesterName: 'M. Williams', approverRole: 'BO', approverName: 'S. Patel', status: 'approved', createdAt: subDays(new Date(), 5).toISOString(), approvedAt: subDays(new Date(), 3).toISOString() },
    { id: 'cr-4', requestType: 'new_mapping', entityType: 'tax_code', entityName: 'Carbon Levy UK/FOB', details: { rate: '2.5%', effective_from: '2026-04-01' }, justification: 'New UK carbon border regulation', requesterRole: 'Ops', requesterName: 'R. García', approverRole: 'BO', approverName: null, status: 'pending', createdAt: subHours(new Date(), 6).toISOString(), approvedAt: null },
    { id: 'cr-5', requestType: 'deactivate', entityType: 'location', entityName: 'Old Cushing Terminal', details: { reason: 'Terminal decommissioned' }, justification: 'Facility closed per ops notice', requesterRole: 'Ops', requesterName: 'J. Smith', approverRole: 'MO', approverName: 'A. Chen', status: 'implemented', createdAt: subDays(new Date(), 10).toISOString(), approvedAt: subDays(new Date(), 8).toISOString() },
  ];
  return requests;
}

export function useMDMGovernance() {
  const [heatmaps] = useState(generateHeatmaps);
  const [issues] = useState(generateIssues);
  const [changeRequests] = useState(generateChangeRequests);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = useMemo(() => issues.filter(i => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (searchQuery && !i.entityName.toLowerCase().includes(searchQuery.toLowerCase()) && !i.issueDescription.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [issues, categoryFilter, severityFilter, statusFilter, searchQuery]);

  const filteredRequests = useMemo(() => changeRequests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery && !r.entityName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [changeRequests, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    avgCoverage: Math.round(heatmaps.reduce((s, h) => s + h.overallPct, 0) / heatmaps.length),
    openIssues: issues.filter(i => i.status === 'open').length,
    criticalGaps: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
    pendingRequests: changeRequests.filter(r => r.status === 'pending').length,
    totalImpactedTrades: issues.filter(i => i.status !== 'resolved').reduce((s, i) => s + i.impactedTrades, 0),
    closeReady: heatmaps.every(h => h.overallPct >= 90),
  }), [heatmaps, issues, changeRequests]);

  return {
    heatmaps, issues, changeRequests, stats,
    filteredIssues, filteredRequests,
    categoryFilter, setCategoryFilter,
    severityFilter, setSeverityFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
  };
}

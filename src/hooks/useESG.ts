import { useState } from 'react';

export type ESGTab = 'dashboard' | 'dd' | 'sourcing' | 'emissions' | 'envproducts';

const demoDueDiligence = [
  { id: '1', counterparty: 'Glencore International', riskTier: 'HIGH', lastReview: '2025-11-15', nextReview: '2026-05-15', status: 'COMPLETED', issues: 'Minor environmental certification gap', checklist: { modernSlavery: true, humanRights: true, envCert: false, sanctions: true, conflictMinerals: true } },
  { id: '2', counterparty: 'Trafigura Group', riskTier: 'MEDIUM', lastReview: '2026-01-20', nextReview: '2026-07-20', status: 'COMPLETED', issues: null, checklist: { modernSlavery: true, humanRights: true, envCert: true, sanctions: true, conflictMinerals: true } },
  { id: '3', counterparty: 'Vitol SA', riskTier: 'LOW', lastReview: '2025-09-01', nextReview: '2026-03-01', status: 'OVERDUE', issues: null, checklist: { modernSlavery: true, humanRights: true, envCert: true, sanctions: true, conflictMinerals: false } },
  { id: '4', counterparty: 'Mercuria Energy', riskTier: 'MEDIUM', lastReview: '2026-02-10', nextReview: '2026-08-10', status: 'COMPLETED', issues: 'Pending conflict minerals assessment', checklist: { modernSlavery: true, humanRights: true, envCert: true, sanctions: true, conflictMinerals: false } },
  { id: '5', counterparty: 'Koch Supply & Trading', riskTier: 'LOW', lastReview: '2026-03-01', nextReview: '2026-09-01', status: 'COMPLETED', issues: null, checklist: { modernSlavery: true, humanRights: true, envCert: true, sanctions: true, conflictMinerals: true } },
];

const demoSourcing = [
  { id: '1', commodity: 'Palm Oil', certRequired: 'RSPO', coveragePct: 78, traceability: 'FACILITY', gaps: 'Indonesian smallholders uncertified' },
  { id: '2', commodity: 'Soy', certRequired: 'RTRS', coveragePct: 62, traceability: 'REGION', gaps: 'Brazil Cerrado sourcing partially uncovered' },
  { id: '3', commodity: 'Cobalt', certRequired: 'RMI', coveragePct: 91, traceability: 'FACILITY', gaps: null },
  { id: '4', commodity: 'Crude Oil', certRequired: 'None', coveragePct: 100, traceability: 'COUNTRY', gaps: null },
  { id: '5', commodity: 'LNG', certRequired: 'None', coveragePct: 100, traceability: 'FACILITY', gaps: null },
];

const demoEmissions = [
  { id: '1', commodity: 'Crude Oil', route: 'Basrah → Rotterdam', scope: '3', method: 'DISTANCE_BASED', gross: 4250, period: 'Q1 2026' },
  { id: '2', commodity: 'LNG', route: 'Sabine Pass → Fos-sur-Mer', scope: '3', method: 'FUEL_BASED', gross: 8900, period: 'Q1 2026' },
  { id: '3', commodity: 'Crude Oil', route: 'WA → Ningbo', scope: '3', method: 'DISTANCE_BASED', gross: 6100, period: 'Q1 2026' },
  { id: '4', commodity: 'Gasoil', route: 'ARA → Lagos', scope: '3', method: 'DEFAULT_FACTOR', gross: 1850, period: 'Q1 2026' },
];

const demoCredits = [
  { id: '1', type: 'VCS Carbon Credit', vintage: 2025, registry: 'Verra', volume: 5000, status: 'RETIRED', retiredAt: '2026-03-15' },
  { id: '2', type: 'Gold Standard', vintage: 2025, registry: 'Gold Standard', volume: 3000, status: 'HELD', retiredAt: null },
  { id: '3', type: 'REC', vintage: 2026, registry: 'M-RETS', volume: 10000, status: 'HELD', retiredAt: null },
  { id: '4', type: 'VCS Carbon Credit', vintage: 2024, registry: 'Verra', volume: 2000, status: 'RETIRED', retiredAt: '2025-12-20' },
];

const demoEmissionsTrend = [
  { quarter: 'Q2 2025', emissions: 18200 },
  { quarter: 'Q3 2025', emissions: 21400 },
  { quarter: 'Q4 2025', emissions: 19800 },
  { quarter: 'Q1 2026', emissions: 21100 },
];

export function useESG() {
  const [activeTab, setActiveTab] = useState<ESGTab>('dashboard');

  const ddCoverage = Math.round((demoDueDiligence.filter(d => d.status === 'COMPLETED').length / demoDueDiligence.length) * 100);
  const sourcingCoverage = Math.round(demoSourcing.reduce((s, p) => s + p.coveragePct, 0) / demoSourcing.length);
  const totalEmissions = demoEmissions.reduce((s, e) => s + e.gross, 0);
  const retiredCredits = demoCredits.filter(c => c.status === 'RETIRED').reduce((s, c) => s + c.volume, 0);
  const overdueDD = demoDueDiligence.filter(d => d.status === 'OVERDUE').length;

  return {
    activeTab, setActiveTab,
    dueDiligence: demoDueDiligence,
    sourcing: demoSourcing,
    emissions: demoEmissions,
    credits: demoCredits,
    emissionsTrend: demoEmissionsTrend,
    kpis: { ddCoverage, sourcingCoverage, totalEmissions, retiredCredits, overdueDD },
  };
}

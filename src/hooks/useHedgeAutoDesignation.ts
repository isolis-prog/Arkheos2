import { useState, useMemo } from 'react';

export interface DraftDesignation {
  id: string;
  tradeId: string;
  hedgeOfTradeId: string | null;
  instrumentDescription: string;
  hedgedItemDescription: string | null;
  riskType: string;
  hedgeType: 'CASH_FLOW' | 'FAIR_VALUE';
  notionalAmount: number;
  currency: string;
  createdAt: string;
  status: 'DRAFT' | 'REVIEWED' | 'DESIGNATED';
  assignedTo: string;
}

export interface AutoTestResult {
  id: string;
  relationshipId: string;
  designationRef: string;
  triggerType: 'MONTH_END_AUTO' | 'MANUAL';
  scheduledDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  effectivenessRatio: number | null;
  passFlag: boolean | null;
  closeTaskCreated: boolean;
}

export interface HedgeCloseTask {
  id: string;
  period: string;
  taskDescription: string;
  taskCategory: string;
  isComplete: boolean;
  dueDate: string;
  completedAt: string | null;
  isRegulatory: boolean;
}

const demoDrafts: DraftDesignation[] = [
  {
    id: 'dd1', tradeId: 'SW-6001', hedgeOfTradeId: 'PHY-2200',
    instrumentDescription: 'Brent swap Q3 2026 — 100K bbl',
    hedgedItemDescription: 'Crude purchase PHY-2200 — 100K bbl Q3 delivery',
    riskType: 'Price Risk', hedgeType: 'CASH_FLOW',
    notionalAmount: 7800000, currency: 'USD',
    createdAt: '2026-04-10T08:30:00Z', status: 'DRAFT',
    assignedTo: 'Maria Chen',
  },
  {
    id: 'dd2', tradeId: 'FUT-9100', hedgeOfTradeId: null,
    instrumentDescription: 'Henry Hub futures Jun-26 — 500K MMBtu',
    hedgedItemDescription: null,
    riskType: 'Price Risk', hedgeType: 'CASH_FLOW',
    notionalAmount: 1500000, currency: 'USD',
    createdAt: '2026-04-09T14:15:00Z', status: 'DRAFT',
    assignedTo: 'David Park',
  },
  {
    id: 'dd3', tradeId: 'FX-4400', hedgeOfTradeId: 'PHY-2180',
    instrumentDescription: 'EUR/USD forward — €5M Sep-26',
    hedgedItemDescription: 'EUR revenue from PHY-2180 — Sep delivery',
    riskType: 'FX Risk', hedgeType: 'CASH_FLOW',
    notionalAmount: 5000000, currency: 'EUR',
    createdAt: '2026-04-08T11:00:00Z', status: 'REVIEWED',
    assignedTo: 'Sarah Liu',
  },
];

const demoAutoTests: AutoTestResult[] = [
  { id: 'at1', relationshipId: 'hr1', designationRef: 'HD-2026-001', triggerType: 'MONTH_END_AUTO', scheduledDate: '2026-03-31', status: 'COMPLETED', effectivenessRatio: 0.93, passFlag: true, closeTaskCreated: false },
  { id: 'at2', relationshipId: 'hr2', designationRef: 'HD-2026-002', triggerType: 'MONTH_END_AUTO', scheduledDate: '2026-03-31', status: 'COMPLETED', effectivenessRatio: 0.74, passFlag: false, closeTaskCreated: true },
  { id: 'at3', relationshipId: 'hr3', designationRef: 'HD-2026-003', triggerType: 'MONTH_END_AUTO', scheduledDate: '2026-03-31', status: 'COMPLETED', effectivenessRatio: 1.01, passFlag: true, closeTaskCreated: false },
  { id: 'at4', relationshipId: 'hr1', designationRef: 'HD-2026-001', triggerType: 'MONTH_END_AUTO', scheduledDate: '2026-04-30', status: 'PENDING', effectivenessRatio: null, passFlag: null, closeTaskCreated: false },
  { id: 'at5', relationshipId: 'hr2', designationRef: 'HD-2026-002', triggerType: 'MONTH_END_AUTO', scheduledDate: '2026-04-30', status: 'PENDING', effectivenessRatio: null, passFlag: null, closeTaskCreated: false },
];

const demoCloseTasks: HedgeCloseTask[] = [
  { id: 'hct1', period: 'Mar 2026', taskDescription: 'All hedge relationships tested — effectiveness assessment complete', taskCategory: 'HEDGE_ACCOUNTING', isComplete: true, dueDate: '2026-04-05', completedAt: '2026-04-03T16:00:00Z', isRegulatory: false },
  { id: 'hct2', period: 'Mar 2026', taskDescription: 'Hedge ineffectiveness review — HD-2026-002', taskCategory: 'HEDGE_ACCOUNTING', isComplete: false, dueDate: '2026-04-05', completedAt: null, isRegulatory: false },
  { id: 'hct3', period: 'Apr 2026', taskDescription: 'All hedge relationships tested — effectiveness assessment complete', taskCategory: 'HEDGE_ACCOUNTING', isComplete: false, dueDate: '2026-05-05', completedAt: null, isRegulatory: false },
];

export function useHedgeAutoDesignation() {
  const [drafts] = useState(demoDrafts);
  const [autoTests] = useState(demoAutoTests);
  const [closeTasks] = useState(demoCloseTasks);

  const draftCount = useMemo(() => drafts.filter(d => d.status === 'DRAFT').length, [drafts]);
  const pendingAutoTests = useMemo(() => autoTests.filter(t => t.status === 'PENDING').length, [autoTests]);
  const ineffectiveCount = useMemo(() => autoTests.filter(t => t.passFlag === false).length, [autoTests]);
  const openCloseTasks = useMemo(() => closeTasks.filter(t => !t.isComplete).length, [closeTasks]);

  return {
    drafts, autoTests, closeTasks,
    draftCount, pendingAutoTests, ineffectiveCount, openCloseTasks,
  };
}

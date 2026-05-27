import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClosePeriod {
  id: string;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  status: 'open' | 'in_progress' | 'pending_signoff' | 'closed' | 'locked';
  targetCloseDate: string;
  actualCloseDate: string | null;
}

export interface CloseTask {
  id: string;
  periodId: string;
  legalEntity: string;
  category: 'risk' | 'accounting' | 'treasury' | 'ops' | 'tax' | 'compliance';
  taskName: string;
  description: string | null;
  ownerName: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: string | null;
  completedAt: string | null;
  slaHours: number | null;
  blockerReason: string | null;
  evidenceRefs: string[];
}

export interface CloseSignoff {
  id: string;
  periodId: string;
  legalEntity: string;
  gateName: string;
  gateOrder: number;
  requiredRole: string;
  signedOffBy: string | null;
  signedOffAt: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'waived';
  comments: string | null;
}

export interface ClosePack {
  id: string;
  periodId: string;
  legalEntity: string;
  packType: 'full' | 'summary' | 'audit';
  generatedAt: string;
  status: 'generating' | 'ready' | 'exported' | 'archived';
  fileSizeBytes: number | null;
}

export interface CloseCockpitFilters {
  periodId: string;
  legalEntity: string;
  category: string;
  status: string;
}

export interface CloseCockpitSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  completionPct: number;
  signoffsCompleted: number;
  signoffsTotal: number;
  packsReady: number;
  daysToTarget: number;
  isOnTrack: boolean;
}

const LEGAL_ENTITIES = ['HarmonyUS', 'HarmonyEU', 'HarmonyUK', 'HarmonyAsia', 'HarmonyLATAM'];
const CATEGORIES: CloseTask['category'][] = ['risk', 'accounting', 'treasury', 'ops', 'tax', 'compliance'];

export const useCloseCockpit = () => {
  const [filters, setFilters] = useState<CloseCockpitFilters>({
    periodId: '',
    legalEntity: '',
    category: '',
    status: '',
  });

  const { data: dbPeriods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['close-cockpit-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('close_periods')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  const periods = useMemo<ClosePeriod[]>(() => {
    if (dbPeriods?.length) {
      return dbPeriods.map((p) => ({
        id: p.id,
        periodName: p.period_name,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        status: p.status as ClosePeriod['status'],
        targetCloseDate: p.target_close_date,
        actualCloseDate: p.actual_close_date,
      }));
    }
    return generateDemoPeriods();
  }, [dbPeriods]);

  const tasks = useMemo<CloseTask[]>(() => generateDemoTasks(periods[0]?.id || 'demo-period'), [periods]);
  const signoffs = useMemo<CloseSignoff[]>(() => generateDemoSignoffs(periods[0]?.id || 'demo-period'), [periods]);
  const packs = useMemo<ClosePack[]>(() => generateDemoPacks(periods[0]?.id || 'demo-period'), [periods]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.legalEntity && t.legalEntity !== filters.legalEntity) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.status && t.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  const summary = useMemo<CloseCockpitSummary>(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const overdue = filteredTasks.filter(t => t.status === 'overdue').length;
    const blocked = filteredTasks.filter(t => t.status === 'blocked').length;
    const soCompleted = signoffs.filter(s => s.status === 'approved').length;
    const packsReady = packs.filter(p => p.status === 'ready' || p.status === 'exported').length;

    const now = new Date();
    const target = periods[0] ? new Date(periods[0].targetCloseDate) : new Date();
    const daysToTarget = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      blockedTasks: blocked,
      completionPct: total > 0 ? (completed / total) * 100 : 0,
      signoffsCompleted: soCompleted,
      signoffsTotal: signoffs.length,
      packsReady,
      daysToTarget,
      isOnTrack: (completed / total) * 100 >= 70 && daysToTarget > 2,
    };
  }, [filteredTasks, signoffs, packs, periods]);

  return {
    periods,
    tasks: filteredTasks,
    signoffs,
    packs,
    summary,
    filters,
    setFilters,
    legalEntities: LEGAL_ENTITIES,
    categories: CATEGORIES,
    isLoading: loadingPeriods,
  };
};

// --- Demo data generators ---

function generateDemoPeriods(): ClosePeriod[] {
  const now = new Date();
  return [
    {
      id: 'period-current',
      periodName: `${now.toLocaleString('en', { month: 'short' })} ${now.getFullYear()}`,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      status: 'in_progress',
      targetCloseDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0],
      actualCloseDate: null,
    },
    {
      id: 'period-prev',
      periodName: `${new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString('en', { month: 'short' })} ${now.getFullYear()}`,
      periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
      periodEnd: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
      status: 'closed',
      targetCloseDate: new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0],
      actualCloseDate: new Date(now.getFullYear(), now.getMonth(), 4).toISOString().split('T')[0],
    },
  ];
}

function generateDemoTasks(periodId: string): CloseTask[] {
  const taskDefs = [
    { category: 'risk' as const, name: 'Mark-to-Market valuation review', priority: 'critical' as const },
    { category: 'risk' as const, name: 'Credit exposure limits check', priority: 'high' as const },
    { category: 'accounting' as const, name: 'Complete trade reconciliation', priority: 'critical' as const },
    { category: 'accounting' as const, name: 'Resolve all critical breaks', priority: 'high' as const },
    { category: 'accounting' as const, name: 'Post accruals & provisions', priority: 'medium' as const },
    { category: 'accounting' as const, name: 'Validate intercompany eliminations', priority: 'high' as const },
    { category: 'treasury' as const, name: 'Lock FX rates for period', priority: 'critical' as const },
    { category: 'treasury' as const, name: 'Cash reconciliation sign-off', priority: 'high' as const },
    { category: 'ops' as const, name: 'Confirm physical deliveries', priority: 'medium' as const },
    { category: 'ops' as const, name: 'Validate inventory positions', priority: 'medium' as const },
    { category: 'tax' as const, name: 'Tax provision calculation', priority: 'high' as const },
    { category: 'tax' as const, name: 'Withholding tax reconciliation', priority: 'medium' as const },
    { category: 'compliance' as const, name: 'Regulatory report preparation', priority: 'low' as const },
    { category: 'compliance' as const, name: 'SOX control evidence review', priority: 'high' as const },
  ];

  const owners = ['John D.', 'Sarah M.', 'Mike R.', 'Lisa K.', 'Tom W.'];
  const statuses: CloseTask['status'][] = ['completed', 'completed', 'completed', 'in_progress', 'in_progress', 'pending', 'blocked', 'overdue'];

  const items: CloseTask[] = [];
  let idx = 0;

  for (const entity of ['HarmonyUS', 'HarmonyEU', 'HarmonyUK']) {
    for (const def of taskDefs) {
      const status = statuses[idx % statuses.length];
      items.push({
        id: `task-${idx}`,
        periodId,
        legalEntity: entity,
        category: def.category,
        taskName: def.name,
        description: null,
        ownerName: owners[idx % owners.length],
        status,
        priority: def.priority,
        dueDate: new Date(Date.now() + (idx - 5) * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: status === 'completed' ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : null,
        slaHours: [24, 48, 72, 96][idx % 4],
        blockerReason: status === 'blocked' ? 'Pending upstream data from ERP' : null,
        evidenceRefs: status === 'completed' ? ['recon-report-001.pdf'] : [],
      });
      idx++;
    }
  }

  return items;
}

function generateDemoSignoffs(periodId: string): CloseSignoff[] {
  const gates = [
    { name: 'Risk Sign-off', role: 'risk_manager', order: 1 },
    { name: 'Accounting Sign-off', role: 'accounting_lead', order: 2 },
    { name: 'Treasury Sign-off', role: 'treasury_lead', order: 3 },
    { name: 'Manager Approval', role: 'manager', order: 4 },
  ];

  const items: CloseSignoff[] = [];
  let idx = 0;
  for (const entity of ['HarmonyUS', 'HarmonyEU', 'HarmonyUK']) {
    for (const gate of gates) {
      const approved = idx < 4;
      items.push({
        id: `signoff-${idx}`,
        periodId,
        legalEntity: entity,
        gateName: gate.name,
        gateOrder: gate.order,
        requiredRole: gate.role,
        signedOffBy: approved ? 'user-123' : null,
        signedOffAt: approved ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() : null,
        status: approved ? 'approved' : 'pending',
        comments: approved ? 'All checks passed' : null,
      });
      idx++;
    }
  }
  return items;
}

function generateDemoPacks(periodId: string): ClosePack[] {
  return ['HarmonyUS', 'HarmonyEU', 'HarmonyUK'].map((entity, i) => ({
    id: `pack-${i}`,
    periodId,
    legalEntity: entity,
    packType: 'full' as const,
    generatedAt: new Date().toISOString(),
    status: i === 0 ? 'ready' as const : 'generating' as const,
    fileSizeBytes: i === 0 ? 2457600 : null,
  }));
}

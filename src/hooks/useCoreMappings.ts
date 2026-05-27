import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────

export type CanonicalEntityType = 'counterparty' | 'product' | 'location' | 'trade' | 'invoice' | 'shipment' | 'payment';
export type MappingMethod = 'exact' | 'fuzzy' | 'manual' | 'rule_based';
export type MatchResult = 'match' | 'possible' | 'no_match';

export interface EntityMapping {
  id: string;
  entityType: CanonicalEntityType;
  sourceSystem: string;
  sourceId: string;
  canonicalId: string;
  canonicalName: string;
  confidenceScore: number;
  mappingMethod: MappingMethod;
  matchResult: MatchResult;
  explainability: Record<string, unknown>;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface MappingFilters {
  search: string;
  entityType: CanonicalEntityType | 'all';
  sourceSystem: string;
  matchResult: MatchResult | 'all';
  approvalStatus: 'all' | 'pending' | 'approved';
}

// ── Demo Data ──────────────────────────────────────────────

const SYSTEMS = ['ETRM', 'ERP', 'CONF', 'OPS', 'BANK'];
const ENTITIES: CanonicalEntityType[] = ['counterparty', 'product', 'location', 'trade', 'invoice', 'shipment', 'payment'];

const demoMappings: EntityMapping[] = [
  { id: 'em-1', entityType: 'counterparty', sourceSystem: 'ETRM', sourceId: 'CP-001', canonicalId: 'cc-1', canonicalName: 'Shell Trading', confidenceScore: 1.0, mappingMethod: 'exact', matchResult: 'match', explainability: { rule: 'Exact name match' }, effectiveFrom: '2025-01-01', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: 'u-2', approvedAt: '2025-01-02', createdAt: '2025-01-01' },
  { id: 'em-2', entityType: 'counterparty', sourceSystem: 'ERP', sourceId: 'V-10042', canonicalId: 'cc-1', canonicalName: 'Shell Trading', confidenceScore: 0.92, mappingMethod: 'fuzzy', matchResult: 'possible', explainability: { rule: 'Fuzzy name 92%', tokens: ['SHELL','TRADING'] }, effectiveFrom: '2025-01-03', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: null, approvedAt: null, createdAt: '2025-01-03' },
  { id: 'em-3', entityType: 'product', sourceSystem: 'ETRM', sourceId: 'BRENT-FOB', canonicalId: 'cp-1', canonicalName: 'Brent Crude FOB', confidenceScore: 1.0, mappingMethod: 'exact', matchResult: 'match', explainability: { rule: 'Code match' }, effectiveFrom: '2025-01-01', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: 'u-2', approvedAt: '2025-01-01', createdAt: '2025-01-01' },
  { id: 'em-4', entityType: 'location', sourceSystem: 'OPS', sourceId: 'ARA-ROT', canonicalId: 'cl-1', canonicalName: 'Rotterdam ARA', confidenceScore: 0.85, mappingMethod: 'fuzzy', matchResult: 'possible', explainability: { rule: 'Partial location match', similarity: 0.85 }, effectiveFrom: '2025-02-01', effectiveTo: null, isActive: true, createdBy: 'u-3', approvedBy: null, approvedAt: null, createdAt: '2025-02-01' },
  { id: 'em-5', entityType: 'trade', sourceSystem: 'CONF', sourceId: 'CONF-2025-0042', canonicalId: 'ct-1', canonicalName: 'TRD-2025-0042', confidenceScore: 1.0, mappingMethod: 'rule_based', matchResult: 'match', explainability: { rule: 'Trade ref exact after normalization' }, effectiveFrom: '2025-02-15', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: 'u-2', approvedAt: '2025-02-15', createdAt: '2025-02-15' },
  { id: 'em-6', entityType: 'counterparty', sourceSystem: 'BANK', sourceId: 'BNK-GLENCORE', canonicalId: 'cc-2', canonicalName: 'Glencore International', confidenceScore: 0.78, mappingMethod: 'fuzzy', matchResult: 'possible', explainability: { rule: 'Token overlap 78%' }, effectiveFrom: '2025-03-01', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: null, approvedAt: null, createdAt: '2025-03-01' },
  { id: 'em-7', entityType: 'invoice', sourceSystem: 'ERP', sourceId: 'INV-90001', canonicalId: 'ci-1', canonicalName: 'INV-2025-90001', confidenceScore: 1.0, mappingMethod: 'exact', matchResult: 'match', explainability: { rule: 'Invoice ref match' }, effectiveFrom: '2025-03-10', effectiveTo: null, isActive: true, createdBy: 'u-2', approvedBy: 'u-2', approvedAt: '2025-03-10', createdAt: '2025-03-10' },
  { id: 'em-8', entityType: 'shipment', sourceSystem: 'OPS', sourceId: 'SHP-V204', canonicalId: 'cs-1', canonicalName: 'SHIP-2025-V204', confidenceScore: 0.65, mappingMethod: 'fuzzy', matchResult: 'no_match', explainability: { rule: 'Vessel name partial, date mismatch' }, effectiveFrom: '2025-03-20', effectiveTo: null, isActive: true, createdBy: 'u-3', approvedBy: null, approvedAt: null, createdAt: '2025-03-20' },
  { id: 'em-9', entityType: 'payment', sourceSystem: 'BANK', sourceId: 'PMT-SW-00123', canonicalId: 'cpmt-1', canonicalName: 'PAY-2025-00123', confidenceScore: 0.95, mappingMethod: 'rule_based', matchResult: 'match', explainability: { rule: 'Amount+date+counterparty match' }, effectiveFrom: '2025-04-01', effectiveTo: null, isActive: true, createdBy: 'u-1', approvedBy: 'u-2', approvedAt: '2025-04-02', createdAt: '2025-04-01' },
  { id: 'em-10', entityType: 'product', sourceSystem: 'ERP', sourceId: 'MAT-GASOL-95', canonicalId: 'cp-2', canonicalName: 'Gasoline 95 RON', confidenceScore: 0.88, mappingMethod: 'fuzzy', matchResult: 'possible', explainability: { rule: 'Commodity group match, grade fuzzy' }, effectiveFrom: '2025-04-05', effectiveTo: null, isActive: true, createdBy: 'u-2', approvedBy: null, approvedAt: null, createdAt: '2025-04-05' },
];

// ── Hook ───────────────────────────────────────────────────

export function useCoreMappings() {
  const [mappings] = useState<EntityMapping[]>(demoMappings);
  const [filters, setFilters] = useState<MappingFilters>({
    search: '',
    entityType: 'all',
    sourceSystem: '',
    matchResult: 'all',
    approvalStatus: 'all',
  });

  const filtered = useMemo(() => {
    return mappings.filter(m => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!m.sourceId.toLowerCase().includes(q) && !m.canonicalName.toLowerCase().includes(q)) return false;
      }
      if (filters.entityType !== 'all' && m.entityType !== filters.entityType) return false;
      if (filters.sourceSystem && m.sourceSystem !== filters.sourceSystem) return false;
      if (filters.matchResult !== 'all' && m.matchResult !== filters.matchResult) return false;
      if (filters.approvalStatus === 'pending' && m.approvedBy !== null) return false;
      if (filters.approvalStatus === 'approved' && m.approvedBy === null) return false;
      return true;
    });
  }, [mappings, filters]);

  const kpis = useMemo(() => ({
    totalMappings: mappings.length,
    activeMappings: mappings.filter(m => m.isActive).length,
    pendingApproval: mappings.filter(m => !m.approvedBy).length,
    avgConfidence: mappings.length > 0 ? Math.round(mappings.reduce((s, m) => s + m.confidenceScore, 0) / mappings.length * 100) : 0,
    matchRate: mappings.length > 0 ? Math.round(mappings.filter(m => m.matchResult === 'match').length / mappings.length * 100) : 0,
    entityTypes: ENTITIES,
    sourceSystems: SYSTEMS,
  }), [mappings]);

  return { mappings: filtered, allMappings: mappings, filters, setFilters, kpis };
}

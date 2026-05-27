import { useState, useMemo } from 'react';
import { subDays, subHours } from 'date-fns';

export interface QualityAttr {
  key: string;
  value: number;
  unit: string;
  contractMin?: number;
  contractMax?: number;
  status: 'pass' | 'fail' | 'warn';
}

export interface QualityCertificate {
  id: string;
  deliveryId: string;
  dealId: string;
  commodity: string;
  counterparty: string;
  labName: string;
  sampleDate: string;
  certificateRef: string;
  attrs: QualityAttr[];
  contractSpecs: Record<string, { min: number; max: number; unit: string }>;
  status: 'pending' | 'evaluated' | 'disputed';
  evaluatedAt: string | null;
  penaltyTotal: number;
  bonusTotal: number;
  netAdjustment: number;
  currency: string;
  createdAt: string;
}

export interface QualityRule {
  id: string;
  commodity: string;
  attrKey: string;
  ruleType: 'penalty' | 'bonus' | 'rejection';
  thresholdMin: number | null;
  thresholdMax: number | null;
  formula: string;
  currency: string;
  description: string;
  version: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
}

export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'settled' | 'disputed';

export interface ClaimCase {
  id: string;
  caseRef: string;
  deliveryId: string;
  certificateId: string;
  counterparty: string;
  commodity: string;
  reason: string;
  amount: number;
  currency: string;
  status: ClaimStatus;
  owner: string;
  dueDate: string;
  resolutionNotes: string | null;
  evidenceCount: number;
  invoiceAdjustmentRef: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const COMMODITIES = ['Crude Oil', 'Gasoline', 'Diesel', 'Jet Fuel', 'LNG', 'Coal', 'Copper'];
const COUNTERPARTIES = ['Shell Trading', 'Vitol', 'Trafigura', 'Glencore', 'BP', 'TotalEnergies'];
const LABS = ['SGS Geneva', 'Intertek Rotterdam', 'Bureau Veritas Houston', 'AmSpec Singapore'];
const ATTR_KEYS: Record<string, { key: string; unit: string; min: number; max: number; typical: number }[]> = {
  'Crude Oil': [
    { key: 'API Gravity', unit: '°API', min: 28, max: 45, typical: 34 },
    { key: 'Sulfur', unit: 'wt%', min: 0.05, max: 3.5, typical: 1.2 },
    { key: 'Water & Sediment', unit: 'vol%', min: 0, max: 1.0, typical: 0.3 },
    { key: 'Salt Content', unit: 'PTB', min: 0, max: 20, typical: 8 },
  ],
  'LNG': [
    { key: 'Gross Heating Value', unit: 'BTU/SCF', min: 1050, max: 1150, typical: 1090 },
    { key: 'Methane', unit: 'mol%', min: 85, max: 99, typical: 92 },
    { key: 'CO2', unit: 'mol%', min: 0, max: 2, typical: 0.5 },
  ],
};

function generateCertificates(): QualityCertificate[] {
  const certs: QualityCertificate[] = [];
  for (let i = 0; i < 18; i++) {
    const commodity = COMMODITIES[i % COMMODITIES.length];
    const specs = ATTR_KEYS[commodity] || ATTR_KEYS['Crude Oil'];
    const attrs: QualityAttr[] = specs.map(s => {
      const variance = (Math.random() - 0.4) * (s.max - s.min) * 0.3;
      const value = +(s.typical + variance).toFixed(3);
      const pass = value >= s.min && value <= s.max;
      const warn = !pass && Math.abs(value - (pass ? 0 : value > s.max ? s.max : s.min)) < (s.max - s.min) * 0.05;
      return {
        key: s.key, value, unit: s.unit,
        contractMin: s.min, contractMax: s.max,
        status: pass ? 'pass' : warn ? 'warn' : 'fail',
      };
    });
    const failCount = attrs.filter(a => a.status === 'fail').length;
    const penalty = failCount * (500 + Math.random() * 5000);
    const bonus = failCount === 0 ? Math.random() * 2000 : 0;
    certs.push({
      id: `cert-${i}`, deliveryId: `DEL-${2400 + i}`, dealId: `TRD-${1000 + i}`,
      commodity, counterparty: COUNTERPARTIES[i % COUNTERPARTIES.length],
      labName: LABS[i % LABS.length], sampleDate: subDays(new Date(), i * 2).toISOString(),
      certificateRef: `LAB-${2025}-${String(i + 1).padStart(4, '0')}`,
      attrs, contractSpecs: {}, status: i < 3 ? 'pending' : i === 5 ? 'disputed' : 'evaluated',
      evaluatedAt: i >= 3 ? subDays(new Date(), i * 2 - 1).toISOString() : null,
      penaltyTotal: +penalty.toFixed(2), bonusTotal: +bonus.toFixed(2),
      netAdjustment: +(bonus - penalty).toFixed(2), currency: 'USD',
      createdAt: subDays(new Date(), i * 2 + 1).toISOString(),
    });
  }
  return certs;
}

function generateRules(): QualityRule[] {
  return [
    { id: 'qr-1', commodity: 'Crude Oil', attrKey: 'Sulfur', ruleType: 'penalty', thresholdMin: null, thresholdMax: 2.0, formula: '(actual - 2.0) * 0.50 * qty_bbl', currency: 'USD', description: 'Sulfur penalty above 2.0 wt%', version: 3, isActive: true, validFrom: '2025-01-01', validTo: null },
    { id: 'qr-2', commodity: 'Crude Oil', attrKey: 'API Gravity', ruleType: 'bonus', thresholdMin: 35, thresholdMax: null, formula: '(actual - 35) * 0.10 * qty_bbl', currency: 'USD', description: 'API bonus above 35°', version: 2, isActive: true, validFrom: '2025-01-01', validTo: null },
    { id: 'qr-3', commodity: 'Crude Oil', attrKey: 'Water & Sediment', ruleType: 'rejection', thresholdMin: null, thresholdMax: 1.0, formula: 'REJECT if > 1.0 vol%', currency: 'USD', description: 'Reject cargo if BS&W > 1.0%', version: 1, isActive: true, validFrom: null, validTo: null },
    { id: 'qr-4', commodity: 'LNG', attrKey: 'Gross Heating Value', ruleType: 'penalty', thresholdMin: 1060, thresholdMax: null, formula: '(1060 - actual) * 0.02 * qty_mmbtu', currency: 'USD', description: 'GHV penalty below 1060 BTU/SCF', version: 1, isActive: true, validFrom: null, validTo: null },
    { id: 'qr-5', commodity: 'Coal', attrKey: 'Ash Content', ruleType: 'penalty', thresholdMin: null, thresholdMax: 12, formula: '(actual - 12) * 0.30 * qty_mt', currency: 'USD', description: 'Ash penalty above 12%', version: 2, isActive: true, validFrom: '2025-06-01', validTo: null },
  ];
}

function generateClaims(certs: QualityCertificate[]): ClaimCase[] {
  const statuses: ClaimStatus[] = ['draft', 'submitted', 'under_review', 'accepted', 'settled', 'disputed', 'rejected'];
  const reasons = ['Sulfur above contract max', 'BS&W exceeds tolerance', 'GHV below minimum', 'API Gravity deviation', 'Ash content penalty', 'Moisture above spec'];
  const owners = ['Maria Santos', 'James Chen', 'Lisa Mueller', 'Ahmed Hassan'];
  return certs.filter(c => c.penaltyTotal > 0).slice(0, 12).map((c, i) => ({
    id: `claim-${i}`, caseRef: `CLM-${2025}-${String(i + 1).padStart(3, '0')}`,
    deliveryId: c.deliveryId, certificateId: c.id,
    counterparty: c.counterparty, commodity: c.commodity,
    reason: reasons[i % reasons.length],
    amount: +(c.penaltyTotal * (0.8 + Math.random() * 0.4)).toFixed(2),
    currency: 'USD', status: statuses[i % statuses.length],
    owner: owners[i % owners.length],
    dueDate: subDays(new Date(), -10 + i * 3).toISOString(),
    resolutionNotes: statuses[i % statuses.length] === 'settled' ? 'Settled via credit note CN-2025-044' : null,
    evidenceCount: 1 + Math.floor(Math.random() * 4),
    invoiceAdjustmentRef: statuses[i % statuses.length] === 'settled' ? `ADJ-${2025}-${i + 1}` : null,
    createdAt: subHours(new Date(), i * 18).toISOString(),
    resolvedAt: statuses[i % statuses.length] === 'settled' ? subDays(new Date(), i).toISOString() : null,
  }));
}

export function useQuality() {
  const [certificates] = useState(() => generateCertificates());
  const [rules] = useState(() => generateRules());
  const [claims] = useState(() => generateClaims(certificates));
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'certificates' | 'claims' | 'rules' | 'pricing' | 'inspectors' | 'exchange'>('certificates');

  const filteredCertificates = useMemo(() => certificates.filter(c => {
    if (commodityFilter !== 'all' && c.commodity !== commodityFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery && !c.deliveryId.toLowerCase().includes(searchQuery.toLowerCase()) && !c.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [certificates, commodityFilter, statusFilter, searchQuery]);

  const selectedCert = useMemo(() => certificates.find(c => c.id === selectedCertId) || null, [certificates, selectedCertId]);
  const selectedClaim = useMemo(() => claims.find(c => c.id === selectedClaimId) || null, [claims, selectedClaimId]);

  const kpis = useMemo(() => {
    const totalClaims = claims.reduce((s, c) => s + c.amount, 0);
    const openClaims = claims.filter(c => !['settled', 'rejected', 'accepted'].includes(c.status));
    const settled = claims.filter(c => c.status === 'settled');
    const avgCycleTime = settled.length > 0 ? settled.reduce((s, c) => {
      const created = new Date(c.createdAt).getTime();
      const resolved = new Date(c.resolvedAt!).getTime();
      return s + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0) / settled.length : 0;

    const specBreaches: Record<string, number> = {};
    certificates.forEach(c => c.attrs.filter(a => a.status === 'fail').forEach(a => {
      specBreaches[a.key] = (specBreaches[a.key] || 0) + 1;
    }));
    const topBreachedSpecs = Object.entries(specBreaches).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalClaimValue: totalClaims,
      openClaimCount: openClaims.length,
      avgCycleTimeDays: +avgCycleTime.toFixed(1),
      certsEvaluated: certificates.filter(c => c.status === 'evaluated').length,
      certsPending: certificates.filter(c => c.status === 'pending').length,
      totalPenalties: certificates.reduce((s, c) => s + c.penaltyTotal, 0),
      totalBonuses: certificates.reduce((s, c) => s + c.bonusTotal, 0),
      topBreachedSpecs,
    };
  }, [certificates, claims]);

  const claimsByStatus = useMemo(() => {
    const groups: Record<string, ClaimCase[]> = { draft: [], submitted: [], under_review: [], accepted: [], settled: [], disputed: [], rejected: [] };
    claims.forEach(c => { if (groups[c.status]) groups[c.status].push(c); });
    return groups;
  }, [claims]);

  return {
    certificates, filteredCertificates, rules, claims, claimsByStatus, kpis,
    commodityFilter, setCommodityFilter, statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedCertId, setSelectedCertId, selectedCert,
    selectedClaimId, setSelectedClaimId, selectedClaim,
    activeTab, setActiveTab,
  };
}

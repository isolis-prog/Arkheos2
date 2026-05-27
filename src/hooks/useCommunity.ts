import { useState } from 'react';

export interface CommunityPack {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  packType: 'template' | 'ruleset' | 'connector' | 'playbook';
  category: string;
  tags: string[];
  authorName: string;
  isOfficial: boolean;
  status: 'draft' | 'in_review' | 'published' | 'deprecated';
  installCount: number;
  avgRating: number;
  reviewCount: number;
  currentVersion: string;
  publishedAt: string;
  versions: PackVersion[];
}

export interface PackVersion {
  id: string;
  versionNumber: string;
  changelog: string;
  isLatest: boolean;
  publishedAt: string;
}

export interface PackReview {
  id: string;
  packId: string;
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface PackInstallation {
  id: string;
  packId: string;
  packName: string;
  packType: string;
  versionNumber: string;
  installedAt: string;
  isActive: boolean;
}

const demoPacks: CommunityPack[] = [
  {
    id: 'p1', name: 'AP/AR 3-Way Match', slug: 'ap-ar-3way', packType: 'template',
    description: 'Complete template for PO → GR → Invoice 3-way matching with tolerance rules and auto-resolution.',
    longDescription: 'Industry-standard three-way matching template that reconciles Purchase Orders against Goods Receipts and Invoices. Includes configurable tolerance bands for quantity and price variances, auto-resolution for within-tolerance breaks, and escalation workflows for material discrepancies.',
    category: 'ap_ar', tags: ['accounts-payable', 'invoice-matching', '3-way-match'], authorName: 'ArkheOS',
    isOfficial: true, status: 'published', installCount: 847, avgRating: 4.7, reviewCount: 23,
    currentVersion: '2.1.0', publishedAt: '2026-01-15T10:00:00Z',
    versions: [
      { id: 'pv1', versionNumber: '2.1.0', changelog: 'Added tax-line matching and currency conversion support', isLatest: true, publishedAt: '2026-01-15T10:00:00Z' },
      { id: 'pv2', versionNumber: '2.0.0', changelog: 'Major rewrite: multi-entity support, improved tolerance engine', isLatest: false, publishedAt: '2025-11-20T10:00:00Z' },
      { id: 'pv3', versionNumber: '1.0.0', changelog: 'Initial release', isLatest: false, publishedAt: '2025-08-01T10:00:00Z' },
    ],
  },
  {
    id: 'p2', name: 'Commodity Trade Recon', slug: 'commodity-trade-recon', packType: 'template',
    description: 'ETRM-to-GL reconciliation for physical and financial commodity trades with UOM conversion.',
    longDescription: 'Designed for energy and commodity trading firms. Reconciles trade captures from ETRM systems (Endur, Allegro, RightAngle) against GL postings in SAP/Oracle. Handles unit-of-measure conversions (bbl↔mt, mmbtu↔gj), multi-leg deals, and netting agreements.',
    category: 'commodities', tags: ['etrm', 'commodity', 'energy', 'physical-trades'], authorName: 'ArkheOS',
    isOfficial: true, status: 'published', installCount: 312, avgRating: 4.5, reviewCount: 14,
    currentVersion: '1.3.0', publishedAt: '2026-02-01T10:00:00Z',
    versions: [
      { id: 'pv4', versionNumber: '1.3.0', changelog: 'Added ISO market nomination support', isLatest: true, publishedAt: '2026-02-01T10:00:00Z' },
      { id: 'pv5', versionNumber: '1.2.0', changelog: 'Multi-currency netting support', isLatest: false, publishedAt: '2025-12-10T10:00:00Z' },
    ],
  },
  {
    id: 'p3', name: 'GL Sub-ledger Recon', slug: 'gl-subledger', packType: 'ruleset',
    description: 'Matching rules for GL vs Sub-ledger reconciliation including intercompany and elimination entries.',
    longDescription: 'Comprehensive ruleset for reconciling General Ledger balances against source sub-ledgers (AP, AR, FA, Inventory). Includes intercompany matching with automatic elimination entry detection and currency translation rules for multi-entity consolidation.',
    category: 'gl', tags: ['general-ledger', 'subledger', 'intercompany', 'close'], authorName: 'FinOps Team',
    isOfficial: false, status: 'published', installCount: 523, avgRating: 4.3, reviewCount: 18,
    currentVersion: '3.0.1', publishedAt: '2026-01-28T10:00:00Z',
    versions: [
      { id: 'pv6', versionNumber: '3.0.1', changelog: 'Hotfix: elimination entry edge case', isLatest: true, publishedAt: '2026-01-28T10:00:00Z' },
    ],
  },
  {
    id: 'p4', name: 'SAP S/4HANA Connector Pack', slug: 'sap-s4hana-connector', packType: 'connector',
    description: 'Pre-built connector with field mappings for SAP S/4HANA: journals, invoices, payments, and master data.',
    longDescription: 'Production-ready connector pack for SAP S/4HANA including pre-configured field mappings for BKPF/BSEG journal entries, BSID/BSAD customer items, BSIK/BSAK vendor items, and master data (BP, GL accounts, cost centers). Includes OData API configuration and batch scheduling templates.',
    category: 'general', tags: ['sap', 's4hana', 'erp', 'connector'], authorName: 'ArkheOS',
    isOfficial: true, status: 'published', installCount: 678, avgRating: 4.8, reviewCount: 31,
    currentVersion: '2.0.0', publishedAt: '2026-02-10T10:00:00Z',
    versions: [
      { id: 'pv7', versionNumber: '2.0.0', changelog: 'S/4HANA 2023 compatibility, new CDS views', isLatest: true, publishedAt: '2026-02-10T10:00:00Z' },
    ],
  },
  {
    id: 'p5', name: 'Exception Triage Playbook', slug: 'exception-triage', packType: 'playbook',
    description: 'Step-by-step guide to investigating and resolving common reconciliation exceptions.',
    longDescription: 'Comprehensive playbook covering the most common exception types: amount mismatches, missing counterparty records, duplicate postings, timing differences, and FX variances. Each scenario includes root cause analysis steps, resolution workflows, and prevention recommendations.',
    category: 'general', tags: ['exceptions', 'playbook', 'best-practices', 'triage'], authorName: 'ArkheOS',
    isOfficial: true, status: 'published', installCount: 1203, avgRating: 4.9, reviewCount: 42,
    currentVersion: '1.2.0', publishedAt: '2026-02-05T10:00:00Z',
    versions: [
      { id: 'pv8', versionNumber: '1.2.0', changelog: 'Added FX variance and intercompany scenarios', isLatest: true, publishedAt: '2026-02-05T10:00:00Z' },
    ],
  },
  {
    id: 'p6', name: 'ISO Gas Market Rules', slug: 'iso-gas-market', packType: 'ruleset',
    description: 'Matching and tolerance rules for ISO gas nomination/scheduling vs settlement reconciliation.',
    longDescription: 'Specialized ruleset for North American ISO/RTO gas markets. Handles nomination vs allocation matching, imbalance calculations, and cashout settlement reconciliation with configurable tolerance bands per pipeline zone.',
    category: 'iso_markets', tags: ['iso', 'gas', 'nominations', 'scheduling'], authorName: 'Energy Ops',
    isOfficial: false, status: 'published', installCount: 89, avgRating: 4.1, reviewCount: 7,
    currentVersion: '1.0.0', publishedAt: '2026-01-20T10:00:00Z',
    versions: [
      { id: 'pv9', versionNumber: '1.0.0', changelog: 'Initial release covering major US pipelines', isLatest: true, publishedAt: '2026-01-20T10:00:00Z' },
    ],
  },
  {
    id: 'p7', name: 'FX Hedge Effectiveness', slug: 'fx-hedge-effectiveness', packType: 'template',
    description: 'Template for testing hedge effectiveness under IFRS 9 / ASC 815 with automated documentation.',
    longDescription: 'Automates the prospective and retrospective hedge effectiveness testing required under IFRS 9 and ASC 815. Includes dollar-offset method, regression analysis, and critical terms match. Generates audit-ready documentation packages.',
    category: 'fx_treasury', tags: ['fx', 'hedging', 'ifrs9', 'asc815', 'treasury'], authorName: 'Risk Control',
    isOfficial: false, status: 'in_review', installCount: 0, avgRating: 0, reviewCount: 0,
    currentVersion: '0.9.0', publishedAt: '',
    versions: [
      { id: 'pv10', versionNumber: '0.9.0', changelog: 'Beta: core effectiveness tests implemented', isLatest: true, publishedAt: '2026-02-14T10:00:00Z' },
    ],
  },
];

const demoReviews: PackReview[] = [
  { id: 'r1', packId: 'p1', reviewerName: 'Maria G.', rating: 5, title: 'Saved us weeks of configuration', body: 'The 3-way match template was production-ready out of the box. Tolerance rules covered all our use cases. Highly recommended for any AP team.', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'r2', packId: 'p1', reviewerName: 'James K.', rating: 4, title: 'Great but needs multi-currency enhancements', body: 'Works perfectly for single-currency matching. The multi-currency support in v2.1 is a great addition, though we needed some customization for exotic pairs.', createdAt: '2026-02-08T10:00:00Z' },
  { id: 'r3', packId: 'p5', reviewerName: 'Sarah L.', rating: 5, title: 'Essential reading for new analysts', body: 'We made this mandatory reading for all new recon analysts. The step-by-step triage process reduced our average resolution time by 40%.', createdAt: '2026-02-12T10:00:00Z' },
  { id: 'r4', packId: 'p4', reviewerName: 'David R.', rating: 5, title: 'Best SAP connector available', body: 'The pre-mapped fields for BKPF/BSEG saved us enormous effort. OData configuration was straightforward and the batch scheduling just works.', createdAt: '2026-02-11T10:00:00Z' },
  { id: 'r5', packId: 'p3', reviewerName: 'Chen W.', rating: 4, title: 'Solid for month-end close', body: 'The intercompany elimination rules are well thought out. Would love to see more granular currency translation controls in a future version.', createdAt: '2026-01-30T10:00:00Z' },
];

const demoInstallations: PackInstallation[] = [
  { id: 'i1', packId: 'p1', packName: 'AP/AR 3-Way Match', packType: 'template', versionNumber: '2.1.0', installedAt: '2026-02-01T10:00:00Z', isActive: true },
  { id: 'i2', packId: 'p4', packName: 'SAP S/4HANA Connector Pack', packType: 'connector', versionNumber: '2.0.0', installedAt: '2026-02-10T10:00:00Z', isActive: true },
  { id: 'i3', packId: 'p5', packName: 'Exception Triage Playbook', packType: 'playbook', versionNumber: '1.2.0', installedAt: '2026-02-06T10:00:00Z', isActive: true },
];

export const useCommunity = () => {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedPack, setSelectedPack] = useState<CommunityPack | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPacks = demoPacks.filter(p => {
    if (p.status !== 'published' && p.status !== 'in_review') return false;
    if (typeFilter !== 'all' && p.packType !== typeFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getReviewsForPack = (packId: string) => demoReviews.filter(r => r.packId === packId);

  return {
    packs: filteredPacks,
    allPacks: demoPacks,
    reviews: demoReviews,
    installations: demoInstallations,
    activeTab, setActiveTab,
    selectedPack, setSelectedPack,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    getReviewsForPack,
  };
};

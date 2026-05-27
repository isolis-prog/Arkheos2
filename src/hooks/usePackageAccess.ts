/**
 * Package Access Hook — Controls module visibility based on tenant's active packages.
 */

import { useMemo } from 'react';

// Package types
export type PackageKey = 'CORE' | 'PHYSICAL_OPS' | 'RISK_TRADING' | 'FINANCE_TREASURY' | 'COMPLIANCE_GOV' | 'AIL';

export interface PackageDefinition {
  key: PackageKey;
  name: string;
  tagline: string;
  color: string;
  dotColor: string;
  bestFor: string;
  keyMetrics: string;
  modules: string[];
  descriptions: Record<string, string>;
}

// Module-to-package mapping constant
export const MODULE_PACKAGE_MAP: Record<string, PackageKey> = {
  // CORE — always accessible
  DASHBOARD: 'CORE',
  RECONCILIATIONS: 'CORE',
  AI_RECON_AGENT: 'CORE',
  CASHFLOWS: 'CORE',
  POSITION_RISK: 'CORE',
  CLOSE_MANAGEMENT: 'CORE',
  REGULATORY_REPORTING: 'CORE',
  DATA_EXPLORER: 'CORE',
  DATA_LOADS: 'CORE',
  AMENDMENTS: 'CORE',
  EXCEPTIONS: 'CORE',
  PNL_ATTRIBUTION: 'CORE',
  TRADE_TO_CASH: 'CORE',
  CREDIT_EXPOSURE: 'CORE',

  // PHYSICAL_OPS
  SUPPLY_CHAIN_STATUS: 'PHYSICAL_OPS',
  LOGISTICS: 'PHYSICAL_OPS',
  SHIPPING_CHARTERING: 'PHYSICAL_OPS',
  SCHEDULING: 'PHYSICAL_OPS',
  INVENTORY: 'PHYSICAL_OPS',
  QUALITY_ASSAY: 'PHYSICAL_OPS',
  MEASUREMENTS: 'PHYSICAL_OPS',
  ISO_SETTLEMENTS: 'PHYSICAL_OPS',
  LOGISTICS_COSTS: 'PHYSICAL_OPS',
  DOC_INTELLIGENCE: 'PHYSICAL_OPS',

  // RISK_TRADING
  MIDDLE_OFFICE: 'RISK_TRADING',
  TRADE_EXPLORER: 'RISK_TRADING',
  TRADE_LIFECYCLE: 'RISK_TRADING',
  STRUCTURED_PRICING: 'RISK_TRADING',
  MARKET_ANALYTICS: 'RISK_TRADING',
  ANALYTICS: 'RISK_TRADING',
  VALUATION_CURVES: 'RISK_TRADING',
  MARKET_DATA: 'RISK_TRADING',
  CONFIRMATIONS_RECON: 'RISK_TRADING',
  VALUATION_RECON: 'RISK_TRADING',
  TRADE_CAPTURE_QA: 'RISK_TRADING',
  OPS_ACTUALS: 'RISK_TRADING',
  MARKET_DATA_CONTROLS: 'RISK_TRADING',

  // FINANCE_TREASURY
  TRADE_FINANCE: 'FINANCE_TREASURY',
  FX_TREASURY: 'FINANCE_TREASURY',
  HEDGE_ACCOUNTING: 'FINANCE_TREASURY',
  COLLATERAL_MARGIN: 'FINANCE_TREASURY',
  CREDIT_RISK: 'FINANCE_TREASURY',
  DEAL_TO_GL: 'FINANCE_TREASURY',
  INTERCOMPANY: 'FINANCE_TREASURY',
  TAX_CONTROLS: 'FINANCE_TREASURY',
  CASH_SETTLEMENT: 'FINANCE_TREASURY',
  MDM_GOVERNANCE: 'FINANCE_TREASURY',

  // COMPLIANCE_GOV
  INTERNAL_AUDIT: 'COMPLIANCE_GOV',
  ESG_SOURCING: 'COMPLIANCE_GOV',
  DATA_QUALITY: 'COMPLIANCE_GOV',
  DATA_HEALTH: 'COMPLIANCE_GOV',
  AUDIT_EXPLAINABILITY: 'COMPLIANCE_GOV',
  AUDIT_LOGS: 'COMPLIANCE_GOV',

  // AIL
  AI_INTELLIGENCE_LAYER: 'AIL',
};

// Route-to-module mapping
export const ROUTE_MODULE_MAP: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/reconciliations': 'RECONCILIATIONS',
  '/recon-agent': 'AI_RECON_AGENT',
  '/exceptions': 'EXCEPTIONS',
  '/amendments': 'AMENDMENTS',
  '/data-loads': 'DATA_LOADS',
  '/data-explorer': 'DATA_EXPLORER',
  '/cashflows': 'CASHFLOWS',
  '/position-risk': 'POSITION_RISK',
  '/position-keeper': 'POSITION_RISK',
  '/mark-to-market': 'POSITION_RISK',
  '/risk-limits': 'POSITION_RISK',
  '/var-dashboard': 'POSITION_RISK',
  '/close-management-hub': 'CLOSE_MANAGEMENT',
  '/close-readiness': 'CLOSE_MANAGEMENT',
  '/close-cockpit': 'CLOSE_MANAGEMENT',
  '/reg-reporting': 'REGULATORY_REPORTING',
  '/pnl-attribution': 'PNL_ATTRIBUTION',
  '/trade-to-cash': 'TRADE_TO_CASH',
  '/credit-exposure': 'CREDIT_EXPOSURE',
  '/operations/supply-chain-status': 'SUPPLY_CHAIN_STATUS',
  '/logistics': 'LOGISTICS',
  '/shipping-chartering': 'SHIPPING_CHARTERING',
  '/scheduling': 'SCHEDULING',
  '/inventory': 'INVENTORY',
  '/quality': 'QUALITY_ASSAY',
  '/measurements': 'MEASUREMENTS',
  '/iso-settlements': 'ISO_SETTLEMENTS',
  '/logistics-costs': 'LOGISTICS_COSTS',
  '/doc-intelligence': 'DOC_INTELLIGENCE',
  '/middle-office': 'MIDDLE_OFFICE',
  '/trade-explorer': 'TRADE_EXPLORER',
  '/trade-lifecycle': 'TRADE_LIFECYCLE',
  '/structured-pricing': 'STRUCTURED_PRICING',
  '/market-analytics': 'MARKET_ANALYTICS',
  '/analytics': 'ANALYTICS',
  '/valuation': 'VALUATION_CURVES',
  '/market-data': 'MARKET_DATA',
  '/confirmations-recon': 'CONFIRMATIONS_RECON',
  '/valuation-recon': 'VALUATION_RECON',
  '/trade-capture-qa': 'TRADE_CAPTURE_QA',
  '/ops-actuals': 'OPS_ACTUALS',
  '/market-data-controls': 'MARKET_DATA_CONTROLS',
  '/trade-finance': 'TRADE_FINANCE',
  '/fx-analytics': 'FX_TREASURY',
  '/hedge-accounting': 'HEDGE_ACCOUNTING',
  '/collateral-margin': 'COLLATERAL_MARGIN',
  '/credit-risk-management': 'CREDIT_RISK',
  '/close-management': 'DEAL_TO_GL',
  '/intercompany': 'INTERCOMPANY',
  '/tax-controls': 'TAX_CONTROLS',
  '/cash-settlement': 'CASH_SETTLEMENT',
  '/mdm-governance': 'MDM_GOVERNANCE',
  '/internal-audit': 'INTERNAL_AUDIT',
  '/esg': 'ESG_SOURCING',
  '/data-quality': 'DATA_QUALITY',
  '/data-health': 'DATA_HEALTH',
  '/audit-explainability': 'AUDIT_EXPLAINABILITY',
  '/audit-logs': 'AUDIT_LOGS',
};

export const PACKAGE_DEFINITIONS: PackageDefinition[] = [
  {
    key: 'PHYSICAL_OPS',
    name: 'Physical Operations',
    tagline: 'End-to-end control of your physical supply chain',
    color: '#E8834A',
    dotColor: 'bg-[#E8834A]',
    bestFor: 'Companies with physical delivery, logistics coordination, inventory management or shipping operations',
    keyMetrics: 'Track nominations to delivery, detect scheduling discrepancies automatically, calculate demurrage without spreadsheets',
    modules: ['SUPPLY_CHAIN_STATUS', 'LOGISTICS', 'SHIPPING_CHARTERING', 'SCHEDULING', 'INVENTORY', 'QUALITY_ASSAY', 'MEASUREMENTS', 'ISO_SETTLEMENTS', 'LOGISTICS_COSTS', 'DOC_INTELLIGENCE'],
    descriptions: {
      SUPPLY_CHAIN_STATUS: 'End-to-end physical supply chain tracking',
      LOGISTICS: 'Movement nominations and delivery management',
      SHIPPING_CHARTERING: 'Voyage management, demurrage, FFAs',
      SCHEDULING: 'Pipeline and delivery scheduling',
      INVENTORY: 'Physical inventory positions (FIFO/weighted avg)',
      QUALITY_ASSAY: 'Assay results and provisional vs final pricing',
      MEASUREMENTS: 'Measurement reconciliation against ETRM',
      ISO_SETTLEMENTS: 'ISO/RTO settlement processing',
      LOGISTICS_COSTS: 'Freight, storage, handling cost tracking',
      DOC_INTELLIGENCE: 'AI-powered document processing',
    },
  },
  {
    key: 'RISK_TRADING',
    name: 'Risk & Trading Intelligence',
    tagline: 'Independent control and analytical depth for your trading books',
    color: '#7B5EA7',
    dotColor: 'bg-[#7B5EA7]',
    bestFor: 'Companies with structured products, independent middle office requirements, or sophisticated market analytics needs',
    keyMetrics: 'Independent P&L validation, option pricing, market fundamentals alongside your positions',
    modules: ['MIDDLE_OFFICE', 'TRADE_EXPLORER', 'TRADE_LIFECYCLE', 'STRUCTURED_PRICING', 'MARKET_ANALYTICS', 'ANALYTICS', 'VALUATION_CURVES', 'MARKET_DATA', 'CONFIRMATIONS_RECON', 'VALUATION_RECON', 'TRADE_CAPTURE_QA', 'OPS_ACTUALS', 'MARKET_DATA_CONTROLS'],
    descriptions: {
      MIDDLE_OFFICE: 'Independent deal review and P&L validation',
      TRADE_EXPLORER: 'Advanced trade search and detail views',
      TRADE_LIFECYCLE: 'End-to-end trade lifecycle tracking',
      STRUCTURED_PRICING: 'Option pricing and Greeks (Black-76)',
      MARKET_ANALYTICS: 'Market fundamentals and spread analysis',
      ANALYTICS: 'KPI dashboards and anomaly detection',
      VALUATION_CURVES: 'Curve management and valuation consistency',
      MARKET_DATA: 'Market data feeds and curve ingestion',
      CONFIRMATIONS_RECON: 'Trade confirmation reconciliation',
      VALUATION_RECON: 'Valuation reconciliation workflows',
      TRADE_CAPTURE_QA: 'Trade capture quality assurance',
      OPS_ACTUALS: 'Operational actuals reconciliation',
      MARKET_DATA_CONTROLS: 'Market data quality controls',
    },
  },
  {
    key: 'FINANCE_TREASURY',
    name: 'Finance & Treasury',
    tagline: 'Complete financial control from trade to balance sheet',
    color: '#2E8B6E',
    dotColor: 'bg-[#2E8B6E]',
    bestFor: 'Companies requiring trade finance management, hedge accounting, credit risk control or intercompany reconciliation',
    keyMetrics: 'LC lifecycle, borrowing base automation, IFRS 9 hedge documentation, credit line monitoring',
    modules: ['TRADE_FINANCE', 'FX_TREASURY', 'HEDGE_ACCOUNTING', 'COLLATERAL_MARGIN', 'CREDIT_RISK', 'DEAL_TO_GL', 'INTERCOMPANY', 'TAX_CONTROLS', 'CASH_SETTLEMENT', 'MDM_GOVERNANCE'],
    descriptions: {
      TRADE_FINANCE: 'Letters of credit and trade finance lifecycle',
      FX_TREASURY: 'FX exposure management and treasury analytics',
      HEDGE_ACCOUNTING: 'IFRS 9 hedge designation and effectiveness',
      COLLATERAL_MARGIN: 'Collateral management and margin calls',
      CREDIT_RISK: 'Credit risk assessment and monitoring',
      DEAL_TO_GL: 'Trade-to-GL posting and sub-ledger control',
      INTERCOMPANY: 'Intercompany netting and reconciliation',
      TAX_CONTROLS: 'Tax compliance and withholding controls',
      CASH_SETTLEMENT: 'Cash settlement reconciliation',
      MDM_GOVERNANCE: 'Master data management and governance',
    },
  },
  {
    key: 'COMPLIANCE_GOV',
    name: 'Compliance & Governance',
    tagline: 'Institutional-grade control framework and audit trail',
    color: '#C0392B',
    dotColor: 'bg-[#C0392B]',
    bestFor: 'Companies with external audit requirements, ESG reporting obligations or independent internal audit function',
    keyMetrics: 'Automated control testing, findings management, supplier due diligence, carbon tracking',
    modules: ['INTERNAL_AUDIT', 'ESG_SOURCING', 'DATA_QUALITY', 'DATA_HEALTH', 'AUDIT_EXPLAINABILITY', 'AUDIT_LOGS'],
    descriptions: {
      INTERNAL_AUDIT: 'Control testing, findings and audit plans',
      ESG_SOURCING: 'ESG reporting and supplier due diligence',
      DATA_QUALITY: 'Data quality rules and scorecards',
      DATA_HEALTH: 'Data pipeline health monitoring',
      AUDIT_EXPLAINABILITY: 'AI decision explainability and audit',
      AUDIT_LOGS: 'Comprehensive audit trail',
    },
  },
  {
    key: 'AIL',
    name: 'AI Intelligence Layer',
    tagline: 'Your operations, continuously improving',
    color: '#3B82F6',
    dotColor: 'bg-[#3B82F6]',
    bestFor: 'Any ArkheOS customer wanting to reduce manual review time and surface operational insights automatically',
    keyMetrics: '99%+ match rate, 60–80% reduction in manual exception review time',
    modules: ['AI_INTELLIGENCE_LAYER'],
    descriptions: {
      AI_INTELLIGENCE_LAYER: 'AI-powered insights, predictions, and recommendations across all modules',
    },
  },
];

// Demo: hardcoded tenant packages (since auth is disabled)
const DEMO_ACTIVE_PACKAGES: PackageKey[] = ['CORE', 'PHYSICAL_OPS', 'RISK_TRADING', 'FINANCE_TREASURY', 'COMPLIANCE_GOV', 'AIL'];
const DEMO_INDIVIDUAL_MODULES: string[] = [];

export function usePackageAccess() {
  // In production, fetch from tenant profile via AuthContext
  const activePackages = DEMO_ACTIVE_PACKAGES;
  const individualModules = DEMO_INDIVIDUAL_MODULES;

  return useMemo(() => {
    const hasAccess = (moduleKey: string): boolean => {
      const pkg = MODULE_PACKAGE_MAP[moduleKey];
      if (!pkg) return true; // Unknown modules default to accessible
      if (pkg === 'CORE') return true;
      if (activePackages.includes(pkg)) return true;
      if (individualModules.includes(moduleKey)) return true;
      return false;
    };

    const packageForModule = (moduleKey: string): PackageKey => {
      return MODULE_PACKAGE_MAP[moduleKey] || 'CORE';
    };

    const isIndividuallyLicensed = (moduleKey: string): boolean => {
      return individualModules.includes(moduleKey);
    };

    const isPackageActive = (pkg: PackageKey): boolean => {
      return pkg === 'CORE' || activePackages.includes(pkg);
    };

    const getPackageDefinition = (pkg: PackageKey): PackageDefinition | undefined => {
      return PACKAGE_DEFINITIONS.find(p => p.key === pkg);
    };

    const getModulePackageDefinition = (moduleKey: string): PackageDefinition | undefined => {
      const pkg = MODULE_PACKAGE_MAP[moduleKey];
      return pkg ? PACKAGE_DEFINITIONS.find(p => p.key === pkg) : undefined;
    };

    const getRouteModule = (path: string): string | undefined => {
      // Try exact match first, then prefix match
      if (ROUTE_MODULE_MAP[path]) return ROUTE_MODULE_MAP[path];
      const match = Object.entries(ROUTE_MODULE_MAP).find(([route]) => path.startsWith(route + '/'));
      return match?.[1];
    };

    const hasRouteAccess = (path: string): boolean => {
      const moduleKey = getRouteModule(path);
      if (!moduleKey) return true;
      return hasAccess(moduleKey);
    };

    return {
      activePackages,
      hasAccess,
      packageForModule,
      isIndividuallyLicensed,
      isPackageActive,
      getPackageDefinition,
      getModulePackageDefinition,
      getRouteModule,
      hasRouteAccess,
    };
  }, [activePackages, individualModules]);
}

// Human-readable module name map
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  DASHBOARD: 'Dashboard',
  RECONCILIATIONS: 'Reconciliations',
  AI_RECON_AGENT: 'AI Recon Agent',
  EXCEPTIONS: 'Exceptions',
  AMENDMENTS: 'Amendments',
  DATA_LOADS: 'Data Loads',
  DATA_EXPLORER: 'Data Explorer',
  CASHFLOWS: 'Cashflows',
  POSITION_RISK: 'Position & Risk',
  CLOSE_MANAGEMENT: 'Close Management',
  REGULATORY_REPORTING: 'Regulatory',
  PNL_ATTRIBUTION: 'P&L Attribution',
  TRADE_TO_CASH: 'Trade-to-Cash',
  CREDIT_EXPOSURE: 'Credit & Exposure',
  SUPPLY_CHAIN_STATUS: 'Supply Chain Status',
  LOGISTICS: 'Logistics',
  SHIPPING_CHARTERING: 'Shipping & Chartering',
  SCHEDULING: 'Scheduling',
  INVENTORY: 'Inventory',
  QUALITY_ASSAY: 'Quality & Assay',
  MEASUREMENTS: 'Measurements',
  ISO_SETTLEMENTS: 'ISO Settlements',
  LOGISTICS_COSTS: 'Logistics Costs',
  DOC_INTELLIGENCE: 'Doc Intelligence',
  MIDDLE_OFFICE: 'Middle Office',
  TRADE_EXPLORER: 'Trade Explorer',
  TRADE_LIFECYCLE: 'Trade Lifecycle',
  STRUCTURED_PRICING: 'Structured Pricing',
  MARKET_ANALYTICS: 'Market Analytics',
  ANALYTICS: 'Analytics',
  VALUATION_CURVES: 'Valuation & Curves',
  MARKET_DATA: 'Market Data',
  CONFIRMATIONS_RECON: 'Confirmations Recon',
  VALUATION_RECON: 'Valuation Recon',
  TRADE_CAPTURE_QA: 'Trade Capture QA',
  OPS_ACTUALS: 'Ops Actuals',
  MARKET_DATA_CONTROLS: 'Market Data Controls',
  TRADE_FINANCE: 'Trade Finance',
  FX_TREASURY: 'FX & Treasury',
  HEDGE_ACCOUNTING: 'Hedge Accounting',
  COLLATERAL_MARGIN: 'Collateral & Margin',
  CREDIT_RISK: 'Credit Risk Mgmt',
  DEAL_TO_GL: 'Deal-to-GL Tower',
  INTERCOMPANY: 'Intercompany',
  TAX_CONTROLS: 'Tax Controls',
  CASH_SETTLEMENT: 'Cash Settlement',
  MDM_GOVERNANCE: 'MDM Governance',
  INTERNAL_AUDIT: 'Internal Audit',
  ESG_SOURCING: 'ESG & Sourcing',
  DATA_QUALITY: 'Data Quality',
  DATA_HEALTH: 'Data Health',
  AUDIT_EXPLAINABILITY: 'Audit & Explainability',
  AUDIT_LOGS: 'Audit Logs',
  AI_INTELLIGENCE_LAYER: 'AI Intelligence Layer',
};

/**
 * Feature Flag Service — Per-tenant module & feature activation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Demo feature flags data (mirrors seeded DB records)
interface FeatureFlag {
  id: string;
  flag_key: string;
  display_name: string;
  description: string;
  domain: string;
  is_global_default: boolean;
  is_enabled: boolean;
  config?: Record<string, unknown>;
}

const DEMO_FLAGS: FeatureFlag[] = [
  { id: 'ff-01', flag_key: 'module.reconciliations', display_name: 'Reconciliations', description: 'Core reconciliation engine', domain: 'reconciliations', is_global_default: true, is_enabled: true },
  { id: 'ff-02', flag_key: 'module.exceptions', display_name: 'Exceptions', description: 'Exception management workflow', domain: 'exceptions', is_global_default: true, is_enabled: true },
  { id: 'ff-03', flag_key: 'module.amendments', display_name: 'Amendments', description: 'Amendment generation and tracking', domain: 'exceptions', is_global_default: true, is_enabled: true },
  { id: 'ff-04', flag_key: 'module.recon_agent', display_name: 'AI Recon Agent', description: 'AI-powered reconciliation agent', domain: 'reconciliations', is_global_default: false, is_enabled: true },
  { id: 'ff-05', flag_key: 'module.trade_explorer', display_name: 'Trade Explorer', description: 'Trade search and detail views', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-06', flag_key: 'module.trade_lifecycle', display_name: 'Trade Lifecycle', description: 'End-to-end trade lifecycle tracking', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-07', flag_key: 'module.pnl_attribution', display_name: 'PnL Attribution', description: 'PnL explain and attribution analysis', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-08', flag_key: 'module.fx_analytics', display_name: 'FX & Treasury', description: 'FX exposure and treasury analytics', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-09', flag_key: 'module.valuation', display_name: 'Valuation & Curves', description: 'Valuation consistency and curve analysis', domain: 'insights', is_global_default: false, is_enabled: false },
  { id: 'ff-10', flag_key: 'module.close_readiness', display_name: 'Close Readiness', description: 'Period-end close readiness dashboard', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-11', flag_key: 'module.data_quality', display_name: 'Data Quality', description: 'Data quality rules and scorecards', domain: 'insights', is_global_default: false, is_enabled: true },
  { id: 'ff-12', flag_key: 'module.cashflows', display_name: 'Cashflows', description: 'Cashflow forecasting and reconciliation', domain: 'cashflows', is_global_default: false, is_enabled: true },
  { id: 'ff-13', flag_key: 'module.logistics', display_name: 'Logistics', description: 'Movements, nominations and inventory', domain: 'logistics', is_global_default: false, is_enabled: true },
  { id: 'ff-14', flag_key: 'module.trade_to_cash', display_name: 'Trade-to-Cash', description: 'Automated trade-to-cash workflow', domain: 't2c', is_global_default: false, is_enabled: true },
  { id: 'ff-15', flag_key: 'module.erp_connectors', display_name: 'ERP Connectors', description: 'ERP integration connectors', domain: 'connectors', is_global_default: false, is_enabled: true },
  { id: 'ff-16', flag_key: 'module.analytics', display_name: 'Advanced Analytics', description: 'KPIs, anomaly detection, alerting', domain: 'analytics', is_global_default: false, is_enabled: true },
  { id: 'ff-17', flag_key: 'module.rules_engine', display_name: 'Rules Engine', description: 'Configurable matching and transform rules', domain: 'rules', is_global_default: false, is_enabled: true },
  { id: 'ff-18', flag_key: 'module.developer_portal', display_name: 'Developer Portal', description: 'API keys, webhooks, API explorer', domain: 'platform', is_global_default: false, is_enabled: true },
  { id: 'ff-19', flag_key: 'feature.auto_match', display_name: 'Auto-Match', description: 'Automatic matching for high-confidence pairs', domain: 'reconciliations', is_global_default: true, is_enabled: true },
  { id: 'ff-20', flag_key: 'feature.bulk_actions', display_name: 'Bulk Actions', description: 'Bulk assign/resolve exceptions', domain: 'exceptions', is_global_default: true, is_enabled: true },
  { id: 'ff-21', flag_key: 'feature.anomaly_detection', display_name: 'Anomaly Detection', description: 'Statistical anomaly detection on metrics', domain: 'analytics', is_global_default: false, is_enabled: false },
  { id: 'ff-22', flag_key: 'feature.uom_conversion', display_name: 'UOM Conversion', description: 'Automatic unit-of-measure conversion', domain: 'logistics', is_global_default: true, is_enabled: true },
  { id: 'ff-23', flag_key: 'feature.fx_conversion', display_name: 'FX Conversion', description: 'Automatic FX rate conversion', domain: 'reconciliations', is_global_default: true, is_enabled: true },
  { id: 'ff-24', flag_key: 'module.ail', display_name: 'Intelligence Layer (AIL)', description: 'AI-powered insights, predictions, and recommendations across all modules', domain: 'platform', is_global_default: false, is_enabled: true },
  { id: 'ff-25', flag_key: 'feature.ail_exception_classification', display_name: 'AI Exception Classification', description: 'Automatic root cause analysis for exceptions', domain: 'platform', is_global_default: false, is_enabled: true },
  { id: 'ff-26', flag_key: 'feature.ail_semantic_matching', display_name: 'AI Semantic Matching', description: 'AI-suggested matches for unmatched bank lines', domain: 'platform', is_global_default: false, is_enabled: true },
  { id: 'ff-27', flag_key: 'feature.ail_natural_language', display_name: 'AI Natural Language Query', description: 'Natural language search in Trade Explorer', domain: 'platform', is_global_default: false, is_enabled: true },
  { id: 'ff-28', flag_key: 'module.community_marketplace', display_name: 'Community Marketplace', description: 'Community marketplace for templates, rule packs, and playbooks', domain: 'platform', is_global_default: false, is_enabled: false },
  { id: 'ff-29', flag_key: 'module.developer_tools', display_name: 'Developer Tools', description: 'Developer & Integrations hub: connectors, workflow builder, API keys', domain: 'platform', is_global_default: false, is_enabled: false },
];

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEMO_FLAGS);

  const isEnabled = useCallback((flagKey: string): boolean => {
    const flag = flags.find(f => f.flag_key === flagKey);
    return flag?.is_enabled ?? false;
  }, [flags]);

  const toggleFlag = useCallback((flagKey: string) => {
    setFlags(prev => prev.map(f =>
      f.flag_key === flagKey ? { ...f, is_enabled: !f.is_enabled } : f
    ));
  }, []);

  const domains = useMemo(() => {
    const domainMap = new Map<string, FeatureFlag[]>();
    flags.forEach(f => {
      const list = domainMap.get(f.domain) ?? [];
      list.push(f);
      domainMap.set(f.domain, list);
    });
    return domainMap;
  }, [flags]);

  const stats = useMemo(() => ({
    total: flags.length,
    enabled: flags.filter(f => f.is_enabled).length,
    disabled: flags.filter(f => !f.is_enabled).length,
    modules: flags.filter(f => f.flag_key.startsWith('module.')).length,
    features: flags.filter(f => f.flag_key.startsWith('feature.')).length,
  }), [flags]);

  return { flags, isEnabled, toggleFlag, domains, stats };
}

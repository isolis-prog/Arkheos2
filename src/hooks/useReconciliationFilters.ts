import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationFilters {
  sourceSystem: string | null;
  financialSystem: string | null;
  periodStart: Date | undefined;
  periodEnd: Date | undefined;
  legalEntities: string[];
  counterparties: string[];
  portfolios: string[];
  instrumentTypes: string[];
  transactionTypes: string[];
}

const defaultFilters: ReconciliationFilters = {
  sourceSystem: null,
  financialSystem: null,
  periodStart: undefined,
  periodEnd: undefined,
  legalEntities: [],
  counterparties: [],
  portfolios: [],
  instrumentTypes: [],
  transactionTypes: [],
};

// Fetch distinct values from canonical_records for filter options
function useDistinctValues(column: 'source_system' | 'legal_entity' | 'book_portfolio' | 'fee_type' | 'record_type') {
  return useQuery({
    queryKey: ['recon-filter-options', column],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canonical_records')
        .select(column)
        .not(column, 'is', null);

      if (error) throw error;

      const unique = [...new Set(
        (data || []).map((r) => String(r[column])).filter(Boolean)
      )].sort();
      return unique;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useCounterpartyOptions() {
  return useQuery({
    queryKey: ['recon-filter-counterparties'],
    queryFn: async () => {
      // Try canonical_counterparties first
      const { data: cpData } = await supabase
        .from('canonical_counterparties')
        .select('name')
        .order('name');

      if (cpData && cpData.length > 0) {
        return cpData.map((c) => c.name);
      }

      // Fallback: distinct counterparty from canonical_records
      const { data: recData } = await supabase
        .from('canonical_records')
        .select('counterparty')
        .not('counterparty', 'is', null);

      const unique = [...new Set(
        (recData || []).map((r) => r.counterparty).filter(Boolean)
      )].sort() as string[];
      return unique;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useReconciliationFilterOptions() {
  const sourceSystems = useDistinctValues('source_system');
  const legalEntities = useDistinctValues('legal_entity');
  const portfolios = useDistinctValues('book_portfolio');
  const instrumentTypes = useDistinctValues('fee_type');
  const transactionTypes = useDistinctValues('record_type');
  const counterparties = useCounterpartyOptions();

  const ETRM_SYSTEMS = ['Allegro', 'Endur', 'RightAngle', 'Aspect', 'Enuit', 'SAP CM'];
  const ERP_SYSTEMS = ['SAP S/4HANA', 'NetSuite', 'Dynamics 365', 'Odoo'];

  // Source systems = ETRM/CTRM names only
  const filteredSourceSystems = useMemo(() => {
    const allSystems = sourceSystems.data || [];
    return allSystems.filter((s) => ETRM_SYSTEMS.includes(s));
  }, [sourceSystems.data]);

  // Financial systems = ERP names only
  const financialSystems = useMemo(() => {
    const allSystems = sourceSystems.data || [];
    return allSystems.filter((s) => ERP_SYSTEMS.includes(s));
  }, [sourceSystems.data]);

  return {
    sourceSystems: filteredSourceSystems,
    financialSystems,
    legalEntities: legalEntities.data || [],
    counterparties: counterparties.data || [],
    portfolios: portfolios.data || [],
    instrumentTypes: instrumentTypes.data || [],
    transactionTypes: transactionTypes.data || [],
    isLoading:
      sourceSystems.isLoading ||
      legalEntities.isLoading ||
      counterparties.isLoading ||
      portfolios.isLoading ||
      instrumentTypes.isLoading ||
      transactionTypes.isLoading,
  };
}

export function useReconciliationFilters() {
  const [filters, setFilters] = useState<ReconciliationFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReconciliationFilters>(defaultFilters);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const clearAll = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof ReconciliationFilters>(
    key: K,
    value: ReconciliationFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.sourceSystem !== null ||
      appliedFilters.financialSystem !== null ||
      appliedFilters.periodStart !== undefined ||
      appliedFilters.periodEnd !== undefined ||
      appliedFilters.legalEntities.length > 0 ||
      appliedFilters.counterparties.length > 0 ||
      appliedFilters.portfolios.length > 0 ||
      appliedFilters.instrumentTypes.length > 0 ||
      appliedFilters.transactionTypes.length > 0
    );
  }, [appliedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    if (appliedFilters.sourceSystem)
      chips.push({ key: 'sourceSystem', label: 'Source', value: appliedFilters.sourceSystem });
    if (appliedFilters.financialSystem)
      chips.push({ key: 'financialSystem', label: 'Financial', value: appliedFilters.financialSystem });
    if (appliedFilters.periodStart)
      chips.push({ key: 'periodStart', label: 'From', value: appliedFilters.periodStart.toLocaleDateString() });
    if (appliedFilters.periodEnd)
      chips.push({ key: 'periodEnd', label: 'To', value: appliedFilters.periodEnd.toLocaleDateString() });
    appliedFilters.legalEntities.forEach((v) =>
      chips.push({ key: `le-${v}`, label: 'Entity', value: v }));
    appliedFilters.counterparties.forEach((v) =>
      chips.push({ key: `cp-${v}`, label: 'Cpty', value: v }));
    appliedFilters.portfolios.forEach((v) =>
      chips.push({ key: `pf-${v}`, label: 'Portfolio', value: v }));
    appliedFilters.instrumentTypes.forEach((v) =>
      chips.push({ key: `it-${v}`, label: 'Instrument', value: v }));
    appliedFilters.transactionTypes.forEach((v) =>
      chips.push({ key: `tt-${v}`, label: 'Txn Type', value: v }));
    return chips;
  }, [appliedFilters]);

  return {
    filters,
    appliedFilters,
    updateFilter,
    applyFilters,
    clearAll,
    hasActiveFilters,
    activeFilterChips,
  };
}

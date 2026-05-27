// Independent filter state for Valuation Recon module
// Reuses the same filter options from the DB but keeps state separate

import { useState, useCallback, useMemo } from 'react';
import { useReconciliationFilterOptions, type ReconciliationFilters } from '@/hooks/useReconciliationFilters';

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

export function useValuationReconFilters() {
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

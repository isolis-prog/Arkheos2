import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface CanonicalRecord {
  id: string;
  sourceSystem: string;
  recordType: string;
  dealId: string | null;
  strategy: string | null;
  feeType: string | null;
  counterparty: string | null;
  legalEntity: string | null;
  amount: number | null;
  currency: string | null;
  docId: string | null;
  lineId: string | null;
  matchKey: string | null;
  economicDate: string | null;
  postingDate: string | null;
  createdAt: string | null;
}

export interface DataExplorerFilters {
  sourceSystem: string;
  recordType: string;
  feeType: string;
  strategy: string;
  counterparty: string;
  legalEntity: string;
  search: string;
}

export function useDataExplorer() {
  const [filters, setFilters] = useState<DataExplorerFilters>({
    sourceSystem: 'all',
    recordType: 'all',
    feeType: 'all',
    strategy: 'all',
    counterparty: 'all',
    legalEntity: 'all',
    search: '',
  });

  const { data: rawRecords, isLoading, error } = useQuery({
    queryKey: ['canonical-records-explorer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canonical_records')
        .select('*')
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const records: CanonicalRecord[] = useMemo(() => {
    return (rawRecords || []).map((r) => ({
      id: r.id,
      sourceSystem: r.source_system,
      recordType: r.record_type,
      dealId: r.deal_id,
      strategy: r.strategy,
      feeType: r.fee_type,
      counterparty: r.counterparty,
      legalEntity: r.legal_entity,
      amount: r.amount ? Number(r.amount) : null,
      currency: r.currency,
      docId: r.doc_id,
      lineId: r.line_id,
      matchKey: r.match_key,
      economicDate: r.economic_date,
      postingDate: r.posting_date,
      createdAt: r.created_at,
    }));
  }, [rawRecords]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const sourceSystems = [...new Set(records.map((r) => r.sourceSystem))];
    const recordTypes = [...new Set(records.map((r) => r.recordType))];
    const feeTypes = [...new Set(records.map((r) => r.feeType).filter(Boolean))] as string[];
    const strategies = [...new Set(records.map((r) => r.strategy).filter(Boolean))] as string[];
    const counterparties = [...new Set(records.map((r) => r.counterparty).filter(Boolean))] as string[];
    const legalEntities = [...new Set(records.map((r) => r.legalEntity).filter(Boolean))] as string[];

    return { sourceSystems, recordTypes, feeTypes, strategies, counterparties, legalEntities };
  }, [records]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filters.sourceSystem !== 'all' && record.sourceSystem !== filters.sourceSystem) return false;
      if (filters.recordType !== 'all' && record.recordType !== filters.recordType) return false;
      if (filters.feeType !== 'all' && record.feeType !== filters.feeType) return false;
      if (filters.strategy !== 'all' && record.strategy !== filters.strategy) return false;
      if (filters.counterparty !== 'all' && record.counterparty !== filters.counterparty) return false;
      if (filters.legalEntity !== 'all' && record.legalEntity !== filters.legalEntity) return false;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [
          record.dealId,
          record.matchKey,
          record.docId,
          record.lineId,
          record.counterparty,
          record.strategy,
          record.feeType,
        ];
        return searchableFields.some((field) => field?.toLowerCase().includes(searchLower));
      }

      return true;
    });
  }, [records, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const etrmRecords = filteredRecords.filter((r) => r.sourceSystem === 'etrm');
    const netsuiteRecords = filteredRecords.filter((r) => r.sourceSystem === 'netsuite');

    const etrmTotal = etrmRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const netsuiteTotal = netsuiteRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

    return {
      totalRecords: filteredRecords.length,
      etrmCount: etrmRecords.length,
      netsuiteCount: netsuiteRecords.length,
      etrmTotal,
      netsuiteTotal,
    };
  }, [filteredRecords]);

  return {
    records: filteredRecords,
    isLoading,
    error,
    filters,
    setFilters,
    filterOptions,
    stats,
  };
}

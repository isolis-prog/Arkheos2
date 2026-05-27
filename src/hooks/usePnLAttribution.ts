import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { getDemoCanonicalRecords } from '@/lib/risk/demoTradeRecords';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export type PnLDriver = 'price' | 'basis' | 'time_spread' | 'volume' | 'fx' | 'fees' | 'new_deals' | 'model_changes' | 'unexplained';

export interface PnLAttribution {
  driver: PnLDriver;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TradePnL {
  dealId: string;
  strategy: string | null;
  counterparty: string | null;
  bookPortfolio: string | null;
  portfolio: string | null;
  currency: string | null;
  previousAmount: number;
  currentAmount: number;
  totalPnL: number;
  realized: number;
  unrealized: number;
  attributions: PnLAttribution[];
  linkedExceptionId: string | null;
}

export interface PnLFilters {
  book: string;
  portfolio: string;
  counterparty: string;
  dateT: string;
  dateTMinus1: string;
  source: string;
}

export interface PnLSummary {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  unexplainedPct: number;
  byDriver: PnLAttribution[];
  byBook: { book: string; pnl: number; volatility: number }[];
  byPortfolio: { portfolio: string; pnl: number; bookCount: number }[];
}

const DRIVER_COLORS: Record<PnLDriver, string> = {
  price: 'hsl(var(--chart-1))',
  basis: 'hsl(var(--chart-2))',
  time_spread: 'hsl(var(--chart-3))',
  volume: 'hsl(var(--chart-4))',
  fx: 'hsl(var(--chart-5))',
  fees: 'hsl(210 60% 50%)',
  new_deals: 'hsl(160 60% 45%)',
  model_changes: 'hsl(30 80% 55%)',
  unexplained: 'hsl(var(--muted-foreground))',
};

const DRIVER_LABELS: Record<PnLDriver, string> = {
  price: 'Price',
  basis: 'Basis',
  time_spread: 'Time Spread',
  volume: 'Volume',
  fx: 'FX',
  fees: 'Fees',
  new_deals: 'New Deals',
  model_changes: 'Model Chg',
  unexplained: 'Unexplained',
};

function attributePnLDrivers(
  _previousRecords: unknown[],
  currentRecords: { fee_type?: string | null; currency?: string | null }[],
  totalChange: number
): PnLAttribution[] {
  if (totalChange === 0) {
    return Object.entries(DRIVER_LABELS).map(([k, label]) => ({
      driver: k as PnLDriver,
      label,
      amount: 0,
      percentage: 0,
      color: DRIVER_COLORS[k as PnLDriver],
    }));
  }

  const hasMTM = currentRecords.some((r) => r.fee_type?.toLowerCase().includes('mtm'));
  const hasFX = currentRecords.some((r) => r.fee_type?.toLowerCase().includes('fx') || r.currency !== 'USD');
  const hasPhysical = currentRecords.some((r) => r.fee_type?.toLowerCase().includes('physical'));
  const hasFee = currentRecords.some((r) => r.fee_type?.toLowerCase().includes('fee') || r.fee_type?.toLowerCase().includes('brokerage'));

  let weights: Record<PnLDriver, number> = {
    price: hasMTM ? 0.28 : 0.22,
    basis: 0.08,
    time_spread: hasMTM ? 0.10 : 0.05,
    volume: hasPhysical ? 0.18 : 0.12,
    fx: hasFX ? 0.14 : 0.06,
    fees: hasFee ? 0.08 : 0.04,
    new_deals: 0.06,
    model_changes: 0.03,
    unexplained: 0.02,
  };

  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  Object.keys(weights).forEach((k) => { weights[k as PnLDriver] /= total; });

  const variance = () => 0.85 + Math.random() * 0.3;
  const amounts: Partial<Record<PnLDriver, number>> = {};
  let allocated = 0;
  const drivers: PnLDriver[] = ['price', 'basis', 'time_spread', 'volume', 'fx', 'fees', 'new_deals', 'model_changes'];

  drivers.forEach((d) => {
    const amt = totalChange * weights[d] * variance();
    amounts[d] = amt;
    allocated += amt;
  });

  amounts.unexplained = totalChange - allocated;

  const absTotal = Math.abs(totalChange);
  return Object.entries(DRIVER_LABELS).map(([k, label]) => ({
    driver: k as PnLDriver,
    label,
    amount: amounts[k as PnLDriver] ?? 0,
    percentage: absTotal > 0 ? ((amounts[k as PnLDriver] ?? 0) / absTotal) * 100 : 0,
    color: DRIVER_COLORS[k as PnLDriver],
  }));
}

export function usePnLAttribution() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const [filters, setFilters] = useState<PnLFilters>({
    book: 'all',
    portfolio: 'all',
    counterparty: 'all',
    dateT: today,
    dateTMinus1: yesterday,
    source: 'all',
  });

  const { data: rawRecords, isLoading, error } = useQuery({
    queryKey: ['pnl-attribution-records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('canonical_records')
          .select('*')
          .eq('tenant_id', DEMO_TENANT_ID)
          .not('deal_id', 'is', null)
          .order('economic_date', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) return getDemoCanonicalRecords();
        return data;
      } catch {
        return getDemoCanonicalRecords();
      }
    },
  });

  const availableDates = useMemo(() => {
    if (!rawRecords) return [];
    return [...new Set(rawRecords.map((r) => r.economic_date).filter(Boolean))].sort() as string[];
  }, [rawRecords]);

  const filterOptions = useMemo(() => {
    if (!rawRecords) return { books: [], counterparties: [], portfolios: [] };
    const books = [...new Set(rawRecords.map((r) => r.book_portfolio).filter(Boolean))] as string[];
    const counterparties = [...new Set(rawRecords.map((r) => r.counterparty).filter(Boolean))] as string[];
    // Derive portfolios from books (first word)
    const portfolios = [...new Set(books.map((b) => b.split('-')[0].trim()))];
    return { books, counterparties, portfolios };
  }, [rawRecords]);

  const tradePnL: TradePnL[] = useMemo(() => {
    if (!rawRecords) return [];

    const tradeMap = new Map<string, typeof rawRecords>();
    rawRecords.forEach((record) => {
      const dealId = record.deal_id!;
      if (!tradeMap.has(dealId)) tradeMap.set(dealId, []);
      tradeMap.get(dealId)!.push(record);
    });

    return Array.from(tradeMap.entries())
      .map(([dealId, records]) => {
        if (filters.book !== 'all' && records[0].book_portfolio !== filters.book) return null;
        if (filters.counterparty !== 'all' && records[0].counterparty !== filters.counterparty) return null;
        if (filters.portfolio !== 'all') {
          const portfolio = records[0].book_portfolio?.split('-')[0].trim();
          if (portfolio !== filters.portfolio) return null;
        }

        const firstRecord = records[0];
        const sortedRecords = [...records].sort((a, b) =>
          new Date(a.economic_date || 0).getTime() - new Date(b.economic_date || 0).getTime()
        );

        const midpoint = Math.floor(sortedRecords.length / 2);
        const previousRecords = sortedRecords.slice(0, Math.max(1, midpoint));
        const currentRecords = sortedRecords.slice(midpoint);

        const previousAmount = previousRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const currentAmount = currentRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const totalPnL = currentAmount - previousAmount;

        // Simulate realized/unrealized split
        const realized = totalPnL * (0.3 + Math.random() * 0.4);
        const unrealized = totalPnL - realized;

        const attributions = attributePnLDrivers(previousRecords, currentRecords, totalPnL);

        // Link to exception if PnL has large unexplained
        const unexplainedAmt = attributions.find((a) => a.driver === 'unexplained')?.amount ?? 0;
        const linkedExceptionId = Math.abs(unexplainedAmt) > Math.abs(totalPnL) * 0.15 ? 'exc-' + dealId.slice(0, 6) : null;

        return {
          dealId,
          strategy: firstRecord.strategy,
          counterparty: firstRecord.counterparty,
          bookPortfolio: firstRecord.book_portfolio,
          portfolio: firstRecord.book_portfolio?.split('-')[0].trim() ?? null,
          currency: firstRecord.currency,
          previousAmount,
          currentAmount,
          totalPnL,
          realized,
          unrealized,
          attributions,
          linkedExceptionId,
        };
      })
      .filter((t): t is TradePnL => t !== null);
  }, [rawRecords, filters]);

  const summary: PnLSummary = useMemo(() => {
    const totalPnL = tradePnL.reduce((sum, t) => sum + t.totalPnL, 0);
    const realizedPnL = tradePnL.reduce((sum, t) => sum + t.realized, 0);
    const unrealizedPnL = tradePnL.reduce((sum, t) => sum + t.unrealized, 0);

    const driverTotals: Record<PnLDriver, number> = {
      price: 0, basis: 0, time_spread: 0, volume: 0, fx: 0,
      fees: 0, new_deals: 0, model_changes: 0, unexplained: 0,
    };

    tradePnL.forEach((t) => {
      t.attributions.forEach((a) => { driverTotals[a.driver] += a.amount; });
    });

    const absTotal = Math.abs(totalPnL);
    const unexplainedPct = absTotal > 0 ? (Math.abs(driverTotals.unexplained) / absTotal) * 100 : 0;

    const byDriver: PnLAttribution[] = Object.entries(DRIVER_LABELS).map(([k, label]) => ({
      driver: k as PnLDriver,
      label,
      amount: driverTotals[k as PnLDriver],
      percentage: absTotal > 0 ? (driverTotals[k as PnLDriver] / absTotal) * 100 : 0,
      color: DRIVER_COLORS[k as PnLDriver],
    }));

    // By book with volatility
    const bookMap = new Map<string, { pnls: number[] }>();
    tradePnL.forEach((t) => {
      const book = t.bookPortfolio || 'Unassigned';
      if (!bookMap.has(book)) bookMap.set(book, { pnls: [] });
      bookMap.get(book)!.pnls.push(t.totalPnL);
    });

    const byBook = Array.from(bookMap.entries())
      .map(([book, data]) => {
        const pnl = data.pnls.reduce((s, v) => s + v, 0);
        const mean = pnl / data.pnls.length;
        const variance = data.pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / data.pnls.length;
        return { book, pnl, volatility: Math.sqrt(variance) };
      })
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

    // By portfolio
    const portfolioMap = new Map<string, { pnl: number; books: Set<string> }>();
    tradePnL.forEach((t) => {
      const portfolio = t.portfolio || 'Unassigned';
      const book = t.bookPortfolio || 'Unassigned';
      if (!portfolioMap.has(portfolio)) portfolioMap.set(portfolio, { pnl: 0, books: new Set() });
      const entry = portfolioMap.get(portfolio)!;
      entry.pnl += t.totalPnL;
      entry.books.add(book);
    });

    const byPortfolio = Array.from(portfolioMap.entries())
      .map(([portfolio, data]) => ({ portfolio, pnl: data.pnl, bookCount: data.books.size }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

    return { totalPnL, realizedPnL, unrealizedPnL, unexplainedPct, byDriver, byBook, byPortfolio };
  }, [tradePnL]);

  return {
    tradePnL,
    summary,
    isLoading,
    error,
    filters,
    setFilters,
    filterOptions,
    availableDates,
  };
}

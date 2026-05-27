import { useMemo } from 'react';

export interface BankAccount {
  accountId: string;
  bankName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  restrictedBalance: number;
  valueDate: string;
}

export interface MarginPosition {
  positionId: string;
  instrument: string;
  desk: string;
  notional: number;
  currentMargin: number;
  marginUp5: number;
  marginDown5: number;
}

export interface CreditFacility {
  facilityId: string;
  bankName: string;
  facilityType: string;
  limitUsd: number;
  drawnUsd: number;
  headroom: number;
  headroomPct: number;
  maturityDate: string;
  interestRate: number;
  daysToMaturity: number;
}

export interface FXFundingGap {
  week: string;
  currency: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  availableCash: number;
  gap: number;
  hasGap: boolean;
}

const FX_RATES: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, CHF: 1.12, JPY: 0.0067, SGD: 0.74, BRL: 0.19 };

const BANKS = ['JP Morgan', 'Citibank', 'HSBC', 'BNP Paribas', 'Deutsche Bank', 'Barclays', 'Standard Chartered'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'SGD', 'JPY', 'BRL'];

function seed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

export function useFXTreasury() {
  const bankAccounts: BankAccount[] = useMemo(() => {
    return BANKS.flatMap((bank, bi) => {
      const numAccounts = 1 + (bi % 3);
      return Array.from({ length: numAccounts }, (_, ai) => {
        const ccy = CURRENCIES[(bi + ai) % CURRENCIES.length];
        const s = seed(`${bank}-${ccy}-${ai}`);
        const bal = 2_000_000 + s * 48_000_000;
        const restricted = bal * (0.02 + s * 0.08);
        return {
          accountId: `ba-${bi}-${ai}`,
          bankName: bank,
          currency: ccy,
          currentBalance: bal,
          availableBalance: bal - restricted,
          restrictedBalance: restricted,
          valueDate: '2026-04-10',
        };
      });
    });
  }, []);

  const totalCashByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    bankAccounts.forEach((a) => {
      map.set(a.currency, (map.get(a.currency) || 0) + a.currentBalance);
    });
    return Array.from(map.entries()).map(([currency, total]) => ({
      currency,
      total,
      usdEquivalent: total * (FX_RATES[currency] || 1),
    })).sort((a, b) => b.usdEquivalent - a.usdEquivalent);
  }, [bankAccounts]);

  const totalCashUsd = totalCashByCurrency.reduce((s, c) => s + c.usdEquivalent, 0);
  const totalAvailableUsd = bankAccounts.reduce((s, a) => s + a.availableBalance * (FX_RATES[a.currency] || 1), 0);

  const bankConcentration = useMemo(() => {
    const map = new Map<string, number>();
    bankAccounts.forEach((a) => {
      const usd = a.currentBalance * (FX_RATES[a.currency] || 1);
      map.set(a.bankName, (map.get(a.bankName) || 0) + usd);
    });
    return Array.from(map.entries())
      .map(([bank, usd]) => ({ bank, usd, pct: (usd / totalCashUsd) * 100 }))
      .sort((a, b) => b.usd - a.usd);
  }, [bankAccounts, totalCashUsd]);

  const marginPositions: MarginPosition[] = useMemo(() => {
    const instruments = [
      { name: 'Brent Crude Swap M1-M6', desk: 'Crude' },
      { name: 'TTF Gas Future M1-M3', desk: 'Gas' },
      { name: 'LME Copper 3M', desk: 'Metals' },
      { name: 'ICE Sugar #11 Call', desk: 'Agri' },
      { name: 'EUR/USD FX Forward', desk: 'FX' },
      { name: 'WTI Put Spread', desk: 'Crude' },
      { name: 'German Power Cal-27', desk: 'Power' },
      { name: 'Gold Spot CFD', desk: 'Metals' },
    ];
    return instruments.map((inst, i) => {
      const s = seed(inst.name);
      const notional = 5_000_000 + s * 45_000_000;
      const marginRate = 0.05 + s * 0.1;
      const currentMargin = notional * marginRate;
      return {
        positionId: `mp-${i}`,
        instrument: inst.name,
        desk: inst.desk,
        notional,
        currentMargin,
        marginUp5: currentMargin * (1.15 + s * 0.2),
        marginDown5: currentMargin * (1.15 + (1 - s) * 0.2),
      };
    });
  }, []);

  const totalMarginCurrent = marginPositions.reduce((s, p) => s + p.currentMargin, 0);
  const totalMarginUp5 = marginPositions.reduce((s, p) => s + p.marginUp5, 0);
  const totalMarginDown5 = marginPositions.reduce((s, p) => s + p.marginDown5, 0);
  const worstCaseMargin = Math.max(totalMarginUp5, totalMarginDown5);
  const marginCoverageRatio = totalAvailableUsd / worstCaseMargin;

  const creditFacilities: CreditFacility[] = useMemo(() => {
    const facilities = [
      { bank: 'JP Morgan', type: 'Revolving Credit', limit: 200_000_000, drawn: 85_000_000, mat: '2027-06-30', rate: 5.25 },
      { bank: 'HSBC', type: 'Term Loan', limit: 150_000_000, drawn: 150_000_000, mat: '2026-12-15', rate: 4.90 },
      { bank: 'BNP Paribas', type: 'Revolving Credit', limit: 100_000_000, drawn: 32_000_000, mat: '2028-03-31', rate: 5.10 },
      { bank: 'Citibank', type: 'Overdraft', limit: 50_000_000, drawn: 8_000_000, mat: '2026-09-30', rate: 6.00 },
      { bank: 'Deutsche Bank', type: 'Revolving Credit', limit: 75_000_000, drawn: 45_000_000, mat: '2026-05-15', rate: 5.50 },
    ];
    const now = new Date();
    return facilities.map((f, i) => {
      const headroom = f.limit - f.drawn;
      const matDate = new Date(f.mat);
      const daysToMat = Math.max(0, Math.round((matDate.getTime() - now.getTime()) / 86_400_000));
      return {
        facilityId: `cf-${i}`,
        bankName: f.bank,
        facilityType: f.type,
        limitUsd: f.limit,
        drawnUsd: f.drawn,
        headroom,
        headroomPct: (headroom / f.limit) * 100,
        maturityDate: f.mat,
        interestRate: f.rate,
        daysToMaturity: daysToMat,
      };
    });
  }, []);

  const totalFacilityLimit = creditFacilities.reduce((s, f) => s + f.limitUsd, 0);
  const totalDrawn = creditFacilities.reduce((s, f) => s + f.drawnUsd, 0);
  const totalHeadroom = totalFacilityLimit - totalDrawn;

  const fxFundingGaps: FXFundingGap[] = useMemo(() => {
    const weeks = ['W16 (Apr 14)', 'W17 (Apr 21)', 'W18 (Apr 28)', 'W19 (May 5)'];
    const ccys = ['USD', 'EUR', 'GBP'];
    return weeks.flatMap((week) =>
      ccys.map((ccy) => {
        const s = seed(`${week}-${ccy}`);
        const inflows = 3_000_000 + s * 15_000_000;
        const outflows = 4_000_000 + (1 - s) * 18_000_000;
        const netFlow = inflows - outflows;
        const available = (totalCashByCurrency.find((c) => c.currency === ccy)?.total || 5_000_000);
        const gap = netFlow < 0 ? Math.min(0, available + netFlow) : 0;
        return { week, currency: ccy, inflows, outflows, netFlow, availableCash: available, gap, hasGap: gap < 0 };
      })
    );
  }, [totalCashByCurrency]);

  return {
    bankAccounts, totalCashByCurrency, totalCashUsd, totalAvailableUsd, bankConcentration,
    marginPositions, totalMarginCurrent, totalMarginUp5, totalMarginDown5, worstCaseMargin, marginCoverageRatio,
    creditFacilities, totalFacilityLimit, totalDrawn, totalHeadroom,
    fxFundingGaps,
  };
}

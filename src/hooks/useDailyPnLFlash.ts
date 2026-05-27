import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';

export interface FlashPosition {
  positionId: string;
  instrument: string;
  quantity: number;
  yesterdayPrice: number;
  currentPrice: number;
  pnlContribution: number;
}

export interface DeskFlash {
  deskId: string;
  deskName: string;
  openingPnL: number;
  currentPnL: number;
  dayChange: number;
  keyDriver: string;
  moPnL: number | null;
  moVariance: number | null;
  asOfTimestamp: Date;
  positions: FlashPosition[];
}

const DESKS = ['Crude Oil', 'Natural Gas', 'Power & Renewables', 'Metals', 'Agri & Softs', 'FX Desk'];

function generatePositions(deskName: string): FlashPosition[] {
  const instruments: Record<string, string[]> = {
    'Crude Oil': ['Brent M1', 'WTI M1', 'Brent/WTI Spread', 'Dubai Crude', 'Urals Diff'],
    'Natural Gas': ['TTF M1', 'Henry Hub M1', 'NBP M2', 'JKM LNG', 'TTF/NBP Spread'],
    'Power & Renewables': ['German Base M1', 'French Peak M1', 'UK Base M1', 'Nordic Hydro', 'RECs Q2'],
    'Metals': ['LME Copper 3M', 'LME Aluminium 3M', 'Gold Spot', 'Silver Spot', 'Nickel M1'],
    'Agri & Softs': ['CBOT Wheat M1', 'CBOT Corn M1', 'ICE Sugar #11', 'Palm Oil M1', 'Soybean M1'],
    'FX Desk': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BRL/USD'],
  };

  const names = instruments[deskName] || ['Position A', 'Position B', 'Position C'];
  return names.map((inst, i) => {
    const qty = (Math.random() > 0.5 ? 1 : -1) * (500 + Math.floor(Math.random() * 5000));
    const yPrice = 50 + Math.random() * 200;
    const change = yPrice * (Math.random() * 0.04 - 0.02);
    return {
      positionId: `pos-${deskName.slice(0, 3).toLowerCase()}-${i}`,
      instrument: inst,
      quantity: qty,
      yesterdayPrice: yPrice,
      currentPrice: yPrice + change,
      pnlContribution: qty * change,
    };
  });
}

export function useDailyPnLFlash() {
  const [expandedDesk, setExpandedDesk] = useState<string | null>(null);
  const [varianceThreshold, setVarianceThreshold] = useState(50000);

  const flashData: DeskFlash[] = useMemo(() => {
    return DESKS.map((desk) => {
      const positions = generatePositions(desk);
      const dayChange = positions.reduce((s, p) => s + p.pnlContribution, 0);
      const openingPnL = (Math.random() - 0.3) * 2_000_000;
      const currentPnL = openingPnL + dayChange;
      const sorted = [...positions].sort((a, b) => Math.abs(b.pnlContribution) - Math.abs(a.pnlContribution));
      const keyDriver = sorted[0]?.instrument ?? '-';
      const moPnL = currentPnL + (Math.random() - 0.5) * 80_000;
      const moVariance = currentPnL - moPnL;

      return {
        deskId: desk.toLowerCase().replace(/[^a-z]/g, '-'),
        deskName: desk,
        openingPnL,
        currentPnL,
        dayChange,
        keyDriver,
        moPnL,
        moVariance,
        asOfTimestamp: new Date(),
        positions: sorted,
      };
    });
  }, []);

  const yesterdayTotal = flashData.reduce((s, d) => s + d.openingPnL, 0);
  const todayTotal = flashData.reduce((s, d) => s + d.currentPnL, 0);
  const totalDayChange = todayTotal - yesterdayTotal;
  const deltaPct = yesterdayTotal !== 0 ? (totalDayChange / Math.abs(yesterdayTotal)) * 100 : 0;

  return {
    flashData,
    expandedDesk,
    setExpandedDesk,
    yesterdayTotal,
    todayTotal,
    totalDayChange,
    deltaPct,
    varianceThreshold,
    setVarianceThreshold,
  };
}

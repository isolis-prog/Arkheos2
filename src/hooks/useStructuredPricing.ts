import { useState, useMemo } from 'react';
import { black76 } from '@/lib/black76';

export interface VolSurfaceEntry {
  id: string;
  commodity: string;
  tenor_days: number;
  strike_pct_atm: number;
  implied_vol_pct: number;
}

export interface PricingRun {
  id: string;
  instrument_type: string;
  commodity: string;
  strike: number;
  expiry_date: string;
  spot_price: number;
  volatility_used: number;
  risk_free_rate: number;
  premium: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  run_at: string;
}

export interface GreeksRow {
  desk: string;
  net_delta: number;
  delta_units: string;
  net_vega: number;
  net_theta: number;
  net_gamma: number;
}

export interface ScenarioResult {
  price_shock_pct: number;
  vol_shock_pct: number;
  pnl_impact: number;
}

export interface PricingQuote {
  id: string;
  deal_name: string;
  legs: { instrument: string; notional: number; strike: number; tenor_months: number; direction: string }[];
  total_premium: number;
  aggregate_greeks: { delta: number; gamma: number; vega: number; theta: number };
  status: string;
}

// Demo vol surface
const demoVolSurface: VolSurfaceEntry[] = [];
const commodities = ['WTI Crude', 'Brent Crude', 'Henry Hub'];
const tenors = [30, 60, 90, 180, 365];
const strikes = [80, 90, 95, 100, 105, 110, 120];
let vsId = 0;
commodities.forEach(c => {
  tenors.forEach(t => {
    strikes.forEach(s => {
      const baseVol = c === 'Henry Hub' ? 45 : 32;
      const skew = (s - 100) * (s < 100 ? -0.15 : 0.08);
      const termStruct = Math.sqrt(365 / t) * 2 - 2;
      const vol = Math.max(10, baseVol + skew + termStruct + (Math.random() - 0.5) * 3);
      demoVolSurface.push({ id: String(++vsId), commodity: c, tenor_days: t, strike_pct_atm: s, implied_vol_pct: Math.round(vol * 100) / 100 });
    });
  });
});

const demoPricingRuns: PricingRun[] = [
  { id: '1', instrument_type: 'European Call', commodity: 'WTI Crude', strike: 75, expiry_date: '2026-09-15', spot_price: 72.45, volatility_used: 32, risk_free_rate: 5, premium: 4.82, delta: 0.42, gamma: 0.031, vega: 0.148, theta: -0.052, run_at: '2026-04-10T14:30:00Z' },
  { id: '2', instrument_type: 'European Put', commodity: 'Brent Crude', strike: 70, expiry_date: '2026-12-15', spot_price: 74.80, volatility_used: 30, risk_free_rate: 5, premium: 3.15, delta: -0.32, gamma: 0.022, vega: 0.185, theta: -0.038, run_at: '2026-04-10T15:00:00Z' },
  { id: '3', instrument_type: 'Asian Call', commodity: 'Henry Hub', strike: 3.50, expiry_date: '2026-07-31', spot_price: 3.42, volatility_used: 45, risk_free_rate: 5, premium: 0.28, delta: 0.45, gamma: 0.82, vega: 0.005, theta: -0.002, run_at: '2026-04-10T16:00:00Z' },
];

const demoGreeks: GreeksRow[] = [
  { desk: 'Crude Americas', net_delta: 125000, delta_units: 'bbl', net_vega: 850000, net_theta: -42000, net_gamma: 3200 },
  { desk: 'Products EMEA', net_delta: -45000, delta_units: 'MT', net_vega: 320000, net_theta: -18000, net_gamma: 1100 },
  { desk: 'Gas & Power', net_delta: 2800000, delta_units: 'MMBtu', net_vega: 1200000, net_theta: -65000, net_gamma: 85000 },
  { desk: 'Structured Solutions', net_delta: 80000, delta_units: 'bbl', net_vega: 2100000, net_theta: -95000, net_gamma: 12000 },
];

const demoQuotes: PricingQuote[] = [
  { id: '1', deal_name: 'Trafigura Q3 Collar', legs: [
    { instrument: 'European Put', notional: 500000, strike: 68, tenor_months: 3, direction: 'Buy' },
    { instrument: 'European Call', notional: 500000, strike: 80, tenor_months: 3, direction: 'Sell' },
  ], total_premium: 125000, aggregate_greeks: { delta: -0.15, gamma: 0.008, vega: 0.42, theta: -0.018 }, status: 'QUOTED' },
  { id: '2', deal_name: 'Shell Accumulator', legs: [
    { instrument: 'Barrier Call (KO)', notional: 200000, strike: 74, tenor_months: 6, direction: 'Buy' },
    { instrument: 'European Put', notional: 200000, strike: 70, tenor_months: 6, direction: 'Sell' },
    { instrument: 'European Put', notional: 200000, strike: 65, tenor_months: 6, direction: 'Buy' },
  ], total_premium: 85000, aggregate_greeks: { delta: 0.28, gamma: 0.015, vega: 0.68, theta: -0.025 }, status: 'DRAFT' },
];

export function useStructuredPricing() {
  const [activeTab, setActiveTab] = useState('option-pricer');
  const [volCommodity, setVolCommodity] = useState('WTI Crude');

  // Option pricer state
  const [pricerForm, setPricerForm] = useState({
    instrument: 'european_call',
    commodity: 'WTI Crude',
    strike: 75,
    expiry: '2026-09-15',
    spot: 72.45,
    vol: 32,
    rate: 5,
  });
  const [pricerResult, setPricerResult] = useState<PricingRun | null>(null);

  const runPricer = () => {
    const isCall = pricerForm.instrument.includes('call');
    const T = (new Date(pricerForm.expiry).getTime() - Date.now()) / (365.25 * 86400000);
    const result = black76({
      F: pricerForm.spot,
      K: pricerForm.strike,
      T: Math.max(T, 0.001),
      sigma: pricerForm.vol / 100,
      r: pricerForm.rate / 100,
      isCall,
    });
    const run: PricingRun = {
      id: String(Date.now()),
      instrument_type: pricerForm.instrument.replace('_', ' '),
      commodity: pricerForm.commodity,
      strike: pricerForm.strike,
      expiry_date: pricerForm.expiry,
      spot_price: pricerForm.spot,
      volatility_used: pricerForm.vol,
      risk_free_rate: pricerForm.rate,
      premium: Math.round(result.premium * 10000) / 10000,
      delta: Math.round(result.delta * 10000) / 10000,
      gamma: Math.round(result.gamma * 10000) / 10000,
      vega: Math.round(result.vega * 10000) / 10000,
      theta: Math.round(result.theta * 10000) / 10000,
      run_at: new Date().toISOString(),
    };
    setPricerResult(run);
  };

  // Vol surface filtered
  const filteredVolSurface = useMemo(() =>
    demoVolSurface.filter(v => v.commodity === volCommodity), [volCommodity]);

  // Scenario analysis
  const priceShocks = [-10, -5, -2, 0, 2, 5, 10];
  const volShocks = [-5, 0, 5, 10];
  const scenarios = useMemo<ScenarioResult[]>(() => {
    const results: ScenarioResult[] = [];
    priceShocks.forEach(ps => {
      volShocks.forEach(vs => {
        const baseNotional = 450000000;
        const avgDelta = 0.35;
        const avgVega = 1200000;
        const pnl = baseNotional * avgDelta * (ps / 100) + avgVega * vs;
        results.push({ price_shock_pct: ps, vol_shock_pct: vs, pnl_impact: Math.round(pnl) });
      });
    });
    return results;
  }, []);

  return {
    activeTab, setActiveTab,
    volCommodity, setVolCommodity,
    pricerForm, setPricerForm, pricerResult, runPricer,
    filteredVolSurface,
    pricingRuns: demoPricingRuns,
    greeks: demoGreeks,
    scenarios, priceShocks, volShocks,
    quotes: demoQuotes,
  };
}

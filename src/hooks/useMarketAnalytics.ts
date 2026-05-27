import { useState } from 'react';

export type MarketAnalyticsTab = 'fundamentals' | 'spreads' | 'flows' | 'weather' | 'macro' | 'watchlist';

// Demo fundamentals data — 18 records across NG, Crude, Power, Refined products & LNG
const demoFundamentals = [
  { id: '1', commodity: 'Natural Gas', dataType: 'STORAGE', region: 'US Lower 48', reportDate: '2026-04-04', value: 1742, unit: 'Bcf', yoyChange: -8.2, vs5yrAvg: -12.5, source: 'EIA Weekly' },
  { id: '2', commodity: 'Natural Gas', dataType: 'STORAGE', region: 'EU (AGSI)', reportDate: '2026-04-04', value: 612, unit: 'TWh', yoyChange: 4.6, vs5yrAvg: 11.2, source: 'GIE AGSI' },
  { id: '3', commodity: 'Natural Gas', dataType: 'PRODUCTION', region: 'US', reportDate: '2026-04-04', value: 104.2, unit: 'Bcf/d', yoyChange: 2.1, vs5yrAvg: 8.4, source: 'EIA Monthly' },
  { id: '4', commodity: 'Natural Gas', dataType: 'EXPORTS', region: 'US LNG', reportDate: '2026-04-03', value: 13.8, unit: 'Bcf/d', yoyChange: 9.4, vs5yrAvg: 28.7, source: 'EIA NG Weekly' },
  { id: '5', commodity: 'Crude Oil', dataType: 'INVENTORY', region: 'Cushing, OK', reportDate: '2026-04-04', value: 23.1, unit: 'MMbbl', yoyChange: -15.3, vs5yrAvg: -22.1, source: 'EIA Weekly' },
  { id: '6', commodity: 'Crude Oil', dataType: 'INVENTORY', region: 'PADD 2', reportDate: '2026-04-04', value: 112.4, unit: 'MMbbl', yoyChange: -4.6, vs5yrAvg: -9.8, source: 'API Weekly' },
  { id: '7', commodity: 'Crude Oil', dataType: 'INVENTORY', region: 'PADD 3 (Gulf)', reportDate: '2026-04-04', value: 248.6, unit: 'MMbbl', yoyChange: -2.1, vs5yrAvg: -5.4, source: 'EIA Weekly' },
  { id: '8', commodity: 'Crude Oil', dataType: 'PRODUCTION', region: 'OPEC+', reportDate: '2026-03-31', value: 41.6, unit: 'MMbbl/d', yoyChange: -1.4, vs5yrAvg: -3.2, source: 'OPEC MOMR' },
  { id: '9', commodity: 'Crude Oil', dataType: 'RIG_COUNT', region: 'US Onshore', reportDate: '2026-04-04', value: 588, unit: 'rigs', yoyChange: -6.8, vs5yrAvg: -14.2, source: 'Baker Hughes' },
  { id: '10', commodity: 'Power', dataType: 'DEMAND', region: 'ERCOT', reportDate: '2026-04-04', value: 42500, unit: 'MW', yoyChange: 3.8, vs5yrAvg: 5.2, source: 'ERCOT RTLMP' },
  { id: '11', commodity: 'Power', dataType: 'DEMAND', region: 'PJM', reportDate: '2026-04-04', value: 88200, unit: 'MW', yoyChange: 2.1, vs5yrAvg: 1.6, source: 'PJM DataMiner' },
  { id: '12', commodity: 'Power', dataType: 'GENERATION', region: 'CAISO Solar', reportDate: '2026-04-04', value: 14200, unit: 'MW', yoyChange: 18.4, vs5yrAvg: 64.1, source: 'CAISO OASIS' },
  { id: '13', commodity: 'Refined Products', dataType: 'INVENTORY', region: 'US Gasoline', reportDate: '2026-04-04', value: 226.8, unit: 'MMbbl', yoyChange: -3.4, vs5yrAvg: -7.1, source: 'EIA Weekly' },
  { id: '14', commodity: 'Refined Products', dataType: 'INVENTORY', region: 'US Distillate', reportDate: '2026-04-04', value: 118.4, unit: 'MMbbl', yoyChange: -8.2, vs5yrAvg: -14.6, source: 'EIA Weekly' },
  { id: '15', commodity: 'Refined Products', dataType: 'REFINERY_RUNS', region: 'US PADD 3', reportDate: '2026-04-04', value: 91.4, unit: '%', yoyChange: 1.8, vs5yrAvg: 0.4, source: 'EIA Weekly' },
  { id: '16', commodity: 'LNG', dataType: 'EXPORTS', region: 'Qatar', reportDate: '2026-03-31', value: 7.6, unit: 'Mt', yoyChange: 1.2, vs5yrAvg: 4.8, source: 'Kpler' },
  { id: '17', commodity: 'Coal', dataType: 'INVENTORY', region: 'ARA Stocks', reportDate: '2026-04-03', value: 5.4, unit: 'Mt', yoyChange: -12.1, vs5yrAvg: -18.4, source: 'Argus' },
  { id: '18', commodity: 'Metals', dataType: 'INVENTORY', region: 'LME Copper', reportDate: '2026-04-04', value: 142500, unit: 'tonnes', yoyChange: 22.4, vs5yrAvg: 8.9, source: 'LME Daily' },
];

const demoSpreads = [
  { id: '1', name: 'Henry Hub vs Waha', current: 0.85, avg30d: 0.72, min1y: 0.15, max1y: 2.45 },
  { id: '2', name: 'Brent vs WTI', current: 4.20, avg30d: 3.95, min1y: 2.10, max1y: 6.80 },
  { id: '3', name: '3-2-1 Crack Spread', current: 28.50, avg30d: 26.80, min1y: 18.20, max1y: 38.60 },
  { id: '4', name: 'Spark Spread (PJM West)', current: 12.40, avg30d: 11.90, min1y: 5.60, max1y: 22.10 },
  { id: '5', name: 'Dark Spread (UK)', current: 18.60, avg30d: 16.40, min1y: 6.20, max1y: 32.40 },
  { id: '6', name: 'TTF vs Henry Hub', current: 6.80, avg30d: 7.20, min1y: 3.10, max1y: 18.40 },
  { id: '7', name: 'JKM vs TTF', current: 1.20, avg30d: 1.45, min1y: -0.50, max1y: 4.20 },
  { id: '8', name: 'Gasoil vs Brent', current: 21.40, avg30d: 19.80, min1y: 12.40, max1y: 34.60 },
  { id: '9', name: 'Heat Rate (ERCOT North)', current: 9.4, avg30d: 8.8, min1y: 6.2, max1y: 14.8 },
  { id: '10', name: 'WTI M+1 vs M+2 (Contango)', current: -0.18, avg30d: -0.05, min1y: -0.40, max1y: 0.65 },
  { id: '11', name: 'API2 vs API4 Coal', current: 8.20, avg30d: 7.80, min1y: 2.40, max1y: 16.40 },
  { id: '12', name: 'Gold vs Silver Ratio', current: 84.2, avg30d: 82.4, min1y: 76.8, max1y: 92.4 },
];

const demoSpreadHistory = Array.from({ length: 120 }, (_, i) => {
  const d = new Date('2025-12-15');
  d.setDate(d.getDate() + i);
  // deterministic-ish jitter
  const t = i / 30;
  return {
    date: d.toISOString().slice(0, 10),
    'Henry Hub vs Waha': +(0.5 + Math.sin(t * 1.3) * 0.6 + Math.random() * 0.4).toFixed(2),
    'Brent vs WTI': +(3.2 + Math.cos(t) * 1.1 + Math.random() * 0.6).toFixed(2),
    'TTF vs Henry Hub': +(6.5 + Math.sin(t * 0.7) * 1.8 + Math.random() * 0.5).toFixed(2),
    'Spark Spread (PJM West)': +(11 + Math.cos(t * 1.5) * 3 + Math.random() * 1.2).toFixed(2),
  };
});

const demoFlows = [
  { id: '1', date: '2026-04-08', commodity: 'LNG', origin: 'Sabine Pass, US', destination: 'Fos-sur-Mer, FR', volume: 3200000, unit: 'MMBtu', source: 'Kpler' },
  { id: '2', date: '2026-04-07', commodity: 'Crude Oil', origin: 'Basrah, IQ', destination: 'Ningbo, CN', volume: 2000000, unit: 'bbl', source: 'Vortexa' },
  { id: '3', date: '2026-04-06', commodity: 'Natural Gas', origin: 'Permian Basin', destination: 'Henry Hub', volume: 8500, unit: 'MMcf/d', source: 'Genscape' },
  { id: '4', date: '2026-04-08', commodity: 'LNG', origin: 'Ras Laffan, QA', destination: 'Futtsu, JP', volume: 3800000, unit: 'MMBtu', source: 'Kpler' },
  { id: '5', date: '2026-04-08', commodity: 'LNG', origin: 'Yamal, RU', destination: 'Zeebrugge, BE', volume: 2900000, unit: 'MMBtu', source: 'ICIS LNG Edge' },
  { id: '6', date: '2026-04-07', commodity: 'Crude Oil', origin: 'Houston, US', destination: 'Rotterdam, NL', volume: 1400000, unit: 'bbl', source: 'Vortexa' },
  { id: '7', date: '2026-04-07', commodity: 'Crude Oil', origin: 'Novorossiysk, RU', destination: 'Mumbai, IN', volume: 1000000, unit: 'bbl', source: 'Kpler' },
  { id: '8', date: '2026-04-06', commodity: 'Diesel', origin: 'Jamnagar, IN', destination: 'Antwerp, BE', volume: 380000, unit: 'bbl', source: 'Vortexa' },
  { id: '9', date: '2026-04-06', commodity: 'Naphtha', origin: 'Sikka, IN', destination: 'Yeosu, KR', volume: 270000, unit: 'bbl', source: 'Kpler' },
  { id: '10', date: '2026-04-05', commodity: 'Coal', origin: 'Newcastle, AU', destination: 'Qinhuangdao, CN', volume: 165000, unit: 'tonnes', source: 'Argus' },
  { id: '11', date: '2026-04-05', commodity: 'Coal', origin: 'Richards Bay, ZA', destination: 'Rotterdam, NL', volume: 140000, unit: 'tonnes', source: 'Argus' },
  { id: '12', date: '2026-04-08', commodity: 'Natural Gas', origin: 'Norway (Troll)', destination: 'NBP, UK', volume: 3200, unit: 'MMcf/d', source: 'Gassco' },
  { id: '13', date: '2026-04-08', commodity: 'Power', origin: 'France (RTE)', destination: 'GB (NGESO)', volume: 2000, unit: 'MW', source: 'IFA Interconnector' },
  { id: '14', date: '2026-04-07', commodity: 'Power', origin: 'Norway (NO2)', destination: 'Germany (DE)', volume: 1400, unit: 'MW', source: 'NordLink' },
  { id: '15', date: '2026-04-04', commodity: 'LPG', origin: 'Houston, US', destination: 'Chiba, JP', volume: 540000, unit: 'bbl', source: 'Kpler' },
  { id: '16', date: '2026-04-04', commodity: 'Crude Oil', origin: 'Hibernia, CA', destination: 'Sarroch, IT', volume: 720000, unit: 'bbl', source: 'Vortexa' },
];

const demoWeather = [
  { id: '1', region: 'US Northeast', type: 'HDD', date: '2026-04-07', actual: 18, forecast: 22, tenYrAvg: 20 },
  { id: '2', region: 'US Northeast', type: 'HDD', date: '2026-04-08', actual: null, forecast: 25, tenYrAvg: 19 },
  { id: '3', region: 'ERCOT', type: 'CDD', date: '2026-04-07', actual: 8, forecast: 6, tenYrAvg: 5 },
  { id: '4', region: 'ERCOT', type: 'CDD', date: '2026-04-08', actual: null, forecast: 10, tenYrAvg: 6 },
  { id: '5', region: 'US Midwest', type: 'HDD', date: '2026-04-07', actual: 12, forecast: 14, tenYrAvg: 16 },
  { id: '6', region: 'US Midwest', type: 'HDD', date: '2026-04-08', actual: null, forecast: 11, tenYrAvg: 15 },
  { id: '7', region: 'US Southeast', type: 'CDD', date: '2026-04-07', actual: 4, forecast: 3, tenYrAvg: 3 },
  { id: '8', region: 'US West (CAISO)', type: 'CDD', date: '2026-04-07', actual: 6, forecast: 8, tenYrAvg: 5 },
  { id: '9', region: 'NW Europe', type: 'HDD', date: '2026-04-07', actual: 10, forecast: 9, tenYrAvg: 12 },
  { id: '10', region: 'NW Europe', type: 'HDD', date: '2026-04-08', actual: null, forecast: 8, tenYrAvg: 11 },
  { id: '11', region: 'Japan (Tokyo)', type: 'HDD', date: '2026-04-07', actual: 5, forecast: 4, tenYrAvg: 6 },
  { id: '12', region: 'Gulf of Mexico', type: 'TROPICAL', date: '2026-04-07', actual: 0, forecast: 0, tenYrAvg: 0 },
];

const demoMacro = [
  { id: '1', indicator: 'DXY (USD Index)', date: '2026-04-07', value: 103.42, source: 'Bloomberg' },
  { id: '2', indicator: 'Fed Funds Rate', date: '2026-04-01', value: 4.50, source: 'FOMC' },
  { id: '3', indicator: 'ECB Deposit Rate', date: '2026-04-01', value: 2.75, source: 'ECB' },
  { id: '4', indicator: 'BoE Bank Rate', date: '2026-04-01', value: 4.25, source: 'BoE' },
  { id: '5', indicator: 'US Industrial Production MoM', date: '2026-03-15', value: 0.3, source: 'Fed' },
  { id: '6', indicator: 'US CPI YoY', date: '2026-03-12', value: 2.6, source: 'BLS' },
  { id: '7', indicator: 'EU HICP YoY', date: '2026-03-31', value: 2.1, source: 'Eurostat' },
  { id: '8', indicator: 'China PMI Manufacturing', date: '2026-04-01', value: 50.8, source: 'NBS' },
  { id: '9', indicator: 'US ISM Manufacturing', date: '2026-04-01', value: 49.6, source: 'ISM' },
  { id: '10', indicator: '10Y Treasury Yield', date: '2026-04-07', value: 4.18, source: 'US Treasury' },
  { id: '11', indicator: '10Y Bund Yield', date: '2026-04-07', value: 2.42, source: 'Bundesbank' },
  { id: '12', indicator: 'WTI Front (settle)', date: '2026-04-07', value: 72.45, source: 'NYMEX' },
  { id: '13', indicator: 'EUR/USD', date: '2026-04-07', value: 1.0846, source: 'Reuters' },
  { id: '14', indicator: 'USD/CNY', date: '2026-04-07', value: 7.214, source: 'PBOC' },
  { id: '15', indicator: 'Baltic Dry Index', date: '2026-04-07', value: 1684, source: 'Baltic Exchange' },
];

const demoWatchlist = [
  { id: '1', type: 'Spread', name: 'Henry Hub vs Waha', value: '$0.85/MMBtu' },
  { id: '2', type: 'Spread', name: 'TTF vs Henry Hub', value: '$6.80/MMBtu' },
  { id: '3', type: 'Spread', name: '3-2-1 Crack', value: '$28.50/bbl' },
  { id: '4', type: 'Storage', name: 'US Gas Storage', value: '1,742 Bcf' },
  { id: '5', type: 'Storage', name: 'EU Gas (AGSI)', value: '612 TWh' },
  { id: '6', type: 'Inventory', name: 'Cushing Crude', value: '23.1 MMbbl' },
  { id: '7', type: 'Macro', name: 'DXY', value: '103.42' },
  { id: '8', type: 'Macro', name: '10Y UST', value: '4.18%' },
  { id: '9', type: 'FX', name: 'EUR/USD', value: '1.0846' },
  { id: '10', type: 'Weather', name: 'ERCOT CDD Forecast', value: '10' },
  { id: '11', type: 'Flow', name: 'US LNG Exports', value: '13.8 Bcf/d' },
  { id: '12', type: 'Flow', name: 'OPEC+ Production', value: '41.6 MMbbl/d' },
];

export function useMarketAnalytics() {
  const [activeTab, setActiveTab] = useState<MarketAnalyticsTab>('fundamentals');

  return {
    activeTab,
    setActiveTab,
    fundamentals: demoFundamentals,
    spreads: demoSpreads,
    spreadHistory: demoSpreadHistory,
    flows: demoFlows,
    weather: demoWeather,
    macro: demoMacro,
    watchlist: demoWatchlist,
    kpis: {
      fundamentalsCount: demoFundamentals.length,
      activeSpreads: demoSpreads.length,
      weatherAlerts: demoWeather.filter(w => w.forecast != null && Math.abs((w.forecast ?? 0) - (w.tenYrAvg ?? 0)) >= 3).length,
      watchlistItems: demoWatchlist.length,
    },
  };
}

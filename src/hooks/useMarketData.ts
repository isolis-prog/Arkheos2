import { useState, useMemo } from 'react';

export type MarketDataSource = 'vendor_feed' | 'etrm_extract' | 'manual_lock' | 'broker_quote' | 'exchange';
export type MarketExceptionType = 'gap' | 'outlier' | 'stale' | 'monotonicity' | 'cross_check_fail' | 'missing_tenor';
export type MarketPointStatus = 'provisional' | 'validated' | 'locked' | 'superseded';

export interface MarketCurve {
  id: string;
  name: string;
  commodity: string;
  location: string | null;
  currency: string;
  source: MarketDataSource;
  granularity: string;
  isActive: boolean;
  pointCount: number;
  lockedCount: number;
  exceptionCount: number;
  lastUpdated: string;
}

export interface MarketPoint {
  id: string;
  curveId: string;
  tenorDt: string;
  price: number;
  currency: string;
  version: number;
  status: MarketPointStatus;
  lockedFlag: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  source: MarketDataSource;
  priorPrice: number | null;
  change: number | null;
  changePct: number | null;
}

export interface MarketDataException {
  id: string;
  curveId: string | null;
  curveName: string;
  pointId: string | null;
  exceptionType: MarketExceptionType;
  severity: 'high' | 'medium' | 'low';
  description: string;
  impactedBooks: string[];
  estimatedMtmImpact: number | null;
  status: 'open' | 'acknowledged' | 'resolved' | 'suppressed';
  createdAt: string;
}

export interface LockAuditEntry {
  id: string;
  curveName: string;
  periodStart: string;
  periodEnd: string;
  action: 'lock' | 'unlock';
  performedBy: string;
  performedAt: string;
  reason: string | null;
  pointsAffected: number;
}

export interface MarketDataFilters {
  commodity: string;
  source: string;
  status: string;
  search: string;
}

const demoCurves: MarketCurve[] = [
  { id: 'c1', name: 'WTI Front Month', commodity: 'Crude Oil', location: 'Cushing, OK', currency: 'USD', source: 'vendor_feed', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 340, exceptionCount: 2, lastUpdated: '2026-02-21T08:30:00Z' },
  { id: 'c2', name: 'Brent M+1', commodity: 'Crude Oil', location: 'ICE', currency: 'USD', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 365, exceptionCount: 0, lastUpdated: '2026-02-21T08:30:00Z' },
  { id: 'c3', name: 'Henry Hub NG', commodity: 'Natural Gas', location: 'Henry Hub', currency: 'USD', source: 'vendor_feed', granularity: 'daily', isActive: true, pointCount: 730, lockedCount: 680, exceptionCount: 3, lastUpdated: '2026-02-21T07:45:00Z' },
  { id: 'c4', name: 'EUR/USD Spot', commodity: 'FX', location: null, currency: 'USD', source: 'vendor_feed', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 360, exceptionCount: 1, lastUpdated: '2026-02-21T09:00:00Z' },
  { id: 'c5', name: 'RBOB Gasoline', commodity: 'Products', location: 'NYMEX', currency: 'USD', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 300, exceptionCount: 4, lastUpdated: '2026-02-20T16:00:00Z' },
  { id: 'c6', name: 'Gold London Fix', commodity: 'Metals', location: 'London', currency: 'USD', source: 'broker_quote', granularity: 'daily', isActive: true, pointCount: 252, lockedCount: 252, exceptionCount: 0, lastUpdated: '2026-02-21T10:30:00Z' },
  { id: 'c7', name: 'Coal API2 CIF ARA', commodity: 'Coal', location: 'ARA', currency: 'USD', source: 'broker_quote', granularity: 'weekly', isActive: true, pointCount: 52, lockedCount: 48, exceptionCount: 1, lastUpdated: '2026-02-20T14:00:00Z' },
  { id: 'c8', name: 'PJM West Hub DA', commodity: 'Power', location: 'PJM West', currency: 'USD', source: 'etrm_extract', granularity: 'hourly', isActive: true, pointCount: 8760, lockedCount: 8000, exceptionCount: 5, lastUpdated: '2026-02-21T06:00:00Z' },
  { id: 'c9', name: 'TTF Front Month', commodity: 'Natural Gas', location: 'TTF (NL)', currency: 'EUR', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 350, exceptionCount: 2, lastUpdated: '2026-02-21T07:00:00Z' },
  { id: 'c10', name: 'NBP Day-Ahead', commodity: 'Natural Gas', location: 'NBP (UK)', currency: 'GBP', source: 'broker_quote', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 340, exceptionCount: 1, lastUpdated: '2026-02-21T07:15:00Z' },
  { id: 'c11', name: 'JKM LNG', commodity: 'LNG', location: 'NE Asia', currency: 'USD', source: 'broker_quote', granularity: 'daily', isActive: true, pointCount: 252, lockedCount: 230, exceptionCount: 2, lastUpdated: '2026-02-21T05:00:00Z' },
  { id: 'c12', name: 'ULSD Heating Oil', commodity: 'Products', location: 'NYMEX', currency: 'USD', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 360, exceptionCount: 0, lastUpdated: '2026-02-21T08:00:00Z' },
  { id: 'c13', name: 'Gasoil ICE', commodity: 'Products', location: 'ICE', currency: 'USD', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 358, exceptionCount: 1, lastUpdated: '2026-02-21T08:15:00Z' },
  { id: 'c14', name: 'ERCOT North DA', commodity: 'Power', location: 'ERCOT North', currency: 'USD', source: 'etrm_extract', granularity: 'hourly', isActive: true, pointCount: 8760, lockedCount: 7600, exceptionCount: 6, lastUpdated: '2026-02-21T06:30:00Z' },
  { id: 'c15', name: 'CAISO SP15 DA', commodity: 'Power', location: 'CAISO SP15', currency: 'USD', source: 'etrm_extract', granularity: 'hourly', isActive: true, pointCount: 8760, lockedCount: 7900, exceptionCount: 3, lastUpdated: '2026-02-21T06:45:00Z' },
  { id: 'c16', name: 'GBP/USD Spot', commodity: 'FX', location: null, currency: 'USD', source: 'vendor_feed', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 365, exceptionCount: 0, lastUpdated: '2026-02-21T09:05:00Z' },
  { id: 'c17', name: 'USD/JPY Spot', commodity: 'FX', location: null, currency: 'USD', source: 'vendor_feed', granularity: 'daily', isActive: true, pointCount: 365, lockedCount: 358, exceptionCount: 1, lastUpdated: '2026-02-21T09:05:00Z' },
  { id: 'c18', name: 'Silver London Fix', commodity: 'Metals', location: 'London', currency: 'USD', source: 'broker_quote', granularity: 'daily', isActive: true, pointCount: 252, lockedCount: 240, exceptionCount: 1, lastUpdated: '2026-02-21T10:35:00Z' },
  { id: 'c19', name: 'LME Copper 3M', commodity: 'Metals', location: 'LME', currency: 'USD', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 252, lockedCount: 250, exceptionCount: 0, lastUpdated: '2026-02-21T10:40:00Z' },
  { id: 'c20', name: 'EUA Carbon Dec', commodity: 'Carbon', location: 'EEX', currency: 'EUR', source: 'exchange', granularity: 'daily', isActive: true, pointCount: 252, lockedCount: 240, exceptionCount: 2, lastUpdated: '2026-02-21T10:00:00Z' },
  { id: 'c21', name: 'CCA California Carbon', commodity: 'Carbon', location: 'CARB', currency: 'USD', source: 'broker_quote', granularity: 'monthly', isActive: false, pointCount: 24, lockedCount: 22, exceptionCount: 1, lastUpdated: '2026-01-31T17:00:00Z' },
];

const demoPoints: MarketPoint[] = [
  // WTI Front Month forward strip (c1)
  { id: 'p1', curveId: 'c1', tenorDt: '2026-02-21', price: 72.45, currency: 'USD', version: 3, status: 'locked', lockedFlag: true, lockedBy: 'John Smith', lockedAt: '2026-02-21T09:00:00Z', source: 'vendor_feed', priorPrice: 72.10, change: 0.35, changePct: 0.49 },
  { id: 'p2', curveId: 'c1', tenorDt: '2026-03-21', price: 73.20, currency: 'USD', version: 2, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 73.50, change: -0.30, changePct: -0.41 },
  { id: 'p3', curveId: 'c1', tenorDt: '2026-04-21', price: 73.85, currency: 'USD', version: 2, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 74.00, change: -0.15, changePct: -0.20 },
  { id: 'p4', curveId: 'c1', tenorDt: '2026-05-21', price: 74.10, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: null, change: null, changePct: null },
  { id: 'p5', curveId: 'c1', tenorDt: '2026-06-21', price: 74.50, currency: 'USD', version: 1, status: 'locked', lockedFlag: true, lockedBy: 'Jane Doe', lockedAt: '2026-02-20T17:00:00Z', source: 'vendor_feed', priorPrice: 74.20, change: 0.30, changePct: 0.40 },
  { id: 'p6', curveId: 'c1', tenorDt: '2026-07-21', price: 74.80, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 74.90, change: -0.10, changePct: -0.13 },
  { id: 'p7', curveId: 'c1', tenorDt: '2026-08-21', price: 75.05, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 74.95, change: 0.10, changePct: 0.13 },
  { id: 'p8', curveId: 'c1', tenorDt: '2026-09-21', price: 75.20, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 75.40, change: -0.20, changePct: -0.27 },
  // Brent (c2)
  { id: 'p9', curveId: 'c2', tenorDt: '2026-02-21', price: 76.65, currency: 'USD', version: 2, status: 'locked', lockedFlag: true, lockedBy: 'Jane Doe', lockedAt: '2026-02-21T09:10:00Z', source: 'exchange', priorPrice: 76.30, change: 0.35, changePct: 0.46 },
  { id: 'p10', curveId: 'c2', tenorDt: '2026-03-21', price: 77.10, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 77.00, change: 0.10, changePct: 0.13 },
  { id: 'p11', curveId: 'c2', tenorDt: '2026-04-21', price: 77.50, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 77.55, change: -0.05, changePct: -0.06 },
  // Henry Hub (c3)
  { id: 'p12', curveId: 'c3', tenorDt: '2026-02-21', price: 2.15, currency: 'USD', version: 4, status: 'locked', lockedFlag: true, lockedBy: 'John Smith', lockedAt: '2026-02-21T07:50:00Z', source: 'vendor_feed', priorPrice: 2.05, change: 0.10, changePct: 4.88 },
  { id: 'p13', curveId: 'c3', tenorDt: '2026-03-21', price: 2.42, currency: 'USD', version: 2, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 2.38, change: 0.04, changePct: 1.68 },
  { id: 'p14', curveId: 'c3', tenorDt: '2026-04-21', price: 2.68, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 2.72, change: -0.04, changePct: -1.47 },
  { id: 'p15', curveId: 'c3', tenorDt: '2026-07-21', price: 3.10, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 3.15, change: -0.05, changePct: -1.59 },
  // EUR/USD (c4)
  { id: 'p16', curveId: 'c4', tenorDt: '2026-02-21', price: 1.0846, currency: 'USD', version: 1, status: 'locked', lockedFlag: true, lockedBy: 'Treasury Ops', lockedAt: '2026-02-21T09:00:00Z', source: 'vendor_feed', priorPrice: 1.0820, change: 0.0026, changePct: 0.24 },
  { id: 'p17', curveId: 'c4', tenorDt: '2026-03-21', price: 1.0862, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'vendor_feed', priorPrice: 1.0855, change: 0.0007, changePct: 0.06 },
  // RBOB (c5)
  { id: 'p18', curveId: 'c5', tenorDt: '2026-02-21', price: 2.34, currency: 'USD', version: 2, status: 'locked', lockedFlag: true, lockedBy: 'John Smith', lockedAt: '2026-02-20T17:00:00Z', source: 'exchange', priorPrice: 2.28, change: 0.06, changePct: 2.63 },
  { id: 'p19', curveId: 'c5', tenorDt: '2026-05-21', price: 2.46, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 2.42, change: 0.04, changePct: 1.65 },
  { id: 'p20', curveId: 'c5', tenorDt: '2026-06-21', price: 2.41, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 2.50, change: -0.09, changePct: -3.60 },
  // TTF (c9)
  { id: 'p21', curveId: 'c9', tenorDt: '2026-02-21', price: 28.40, currency: 'EUR', version: 2, status: 'locked', lockedFlag: true, lockedBy: 'EU Desk', lockedAt: '2026-02-21T07:00:00Z', source: 'exchange', priorPrice: 27.85, change: 0.55, changePct: 1.97 },
  { id: 'p22', curveId: 'c9', tenorDt: '2026-04-21', price: 26.10, currency: 'EUR', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 26.40, change: -0.30, changePct: -1.14 },
  { id: 'p23', curveId: 'c9', tenorDt: '2026-10-21', price: 31.20, currency: 'EUR', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 31.10, change: 0.10, changePct: 0.32 },
  // JKM (c11)
  { id: 'p24', curveId: 'c11', tenorDt: '2026-02-21', price: 14.20, currency: 'USD', version: 2, status: 'locked', lockedFlag: true, lockedBy: 'LNG Desk', lockedAt: '2026-02-21T05:00:00Z', source: 'broker_quote', priorPrice: 14.05, change: 0.15, changePct: 1.07 },
  { id: 'p25', curveId: 'c11', tenorDt: '2026-08-21', price: 13.40, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'broker_quote', priorPrice: 13.55, change: -0.15, changePct: -1.11 },
  // ERCOT North (c14)
  { id: 'p26', curveId: 'c14', tenorDt: '2026-02-21', price: 38.20, currency: 'USD', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'etrm_extract', priorPrice: 36.50, change: 1.70, changePct: 4.66 },
  { id: 'p27', curveId: 'c14', tenorDt: '2026-08-21', price: 84.50, currency: 'USD', version: 1, status: 'provisional', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'etrm_extract', priorPrice: 79.20, change: 5.30, changePct: 6.69 },
  // EUA (c20)
  { id: 'p28', curveId: 'c20', tenorDt: '2026-12-21', price: 78.20, currency: 'EUR', version: 2, status: 'locked', lockedFlag: true, lockedBy: 'Carbon Desk', lockedAt: '2026-02-21T10:00:00Z', source: 'exchange', priorPrice: 77.40, change: 0.80, changePct: 1.03 },
  { id: 'p29', curveId: 'c20', tenorDt: '2027-12-21', price: 82.10, currency: 'EUR', version: 1, status: 'validated', lockedFlag: false, lockedBy: null, lockedAt: null, source: 'exchange', priorPrice: 82.40, change: -0.30, changePct: -0.36 },
  // LME Copper (c19)
  { id: 'p30', curveId: 'c19', tenorDt: '2026-05-21', price: 9420, currency: 'USD', version: 1, status: 'locked', lockedFlag: true, lockedBy: 'Metals Desk', lockedAt: '2026-02-21T10:40:00Z', source: 'exchange', priorPrice: 9385, change: 35, changePct: 0.37 },
];

const demoExceptions: MarketDataException[] = [
  { id: 'e1', curveId: 'c1', curveName: 'WTI Front Month', pointId: 'p3', exceptionType: 'outlier', severity: 'high', description: 'Price moved >3σ from 20-day mean', impactedBooks: ['Crude Trading', 'Hedging'], estimatedMtmImpact: 1250000, status: 'open', createdAt: '2026-02-21T08:35:00Z' },
  { id: 'e2', curveId: 'c3', curveName: 'Henry Hub NG', pointId: null, exceptionType: 'gap', severity: 'medium', description: 'Missing data for Feb-18 to Feb-19', impactedBooks: ['Gas Trading'], estimatedMtmImpact: 340000, status: 'open', createdAt: '2026-02-20T09:00:00Z' },
  { id: 'e3', curveId: 'c3', curveName: 'Henry Hub NG', pointId: null, exceptionType: 'stale', severity: 'high', description: 'No update in 36 hours', impactedBooks: ['Gas Trading', 'Storage'], estimatedMtmImpact: 890000, status: 'acknowledged', createdAt: '2026-02-20T18:00:00Z' },
  { id: 'e4', curveId: 'c5', curveName: 'RBOB Gasoline', pointId: null, exceptionType: 'monotonicity', severity: 'medium', description: 'Forward curve inversion detected M+3 to M+4', impactedBooks: ['Products Trading'], estimatedMtmImpact: 560000, status: 'open', createdAt: '2026-02-21T07:00:00Z' },
  { id: 'e5', curveId: 'c4', curveName: 'EUR/USD Spot', pointId: null, exceptionType: 'cross_check_fail', severity: 'low', description: 'Vendor vs ETRM delta > 0.5%', impactedBooks: ['Treasury'], estimatedMtmImpact: 120000, status: 'resolved', createdAt: '2026-02-19T14:00:00Z' },
  { id: 'e6', curveId: 'c8', curveName: 'PJM West Hub DA', pointId: null, exceptionType: 'missing_tenor', severity: 'high', description: '12 hourly intervals missing for 02/20', impactedBooks: ['Power Trading', 'Origination'], estimatedMtmImpact: 2100000, status: 'open', createdAt: '2026-02-21T06:15:00Z' },
  { id: 'e7', curveId: 'c5', curveName: 'RBOB Gasoline', pointId: null, exceptionType: 'outlier', severity: 'medium', description: 'Spread vs WTI widened beyond historical range', impactedBooks: ['Products Trading'], estimatedMtmImpact: 430000, status: 'open', createdAt: '2026-02-21T08:00:00Z' },
  { id: 'e8', curveId: 'c7', curveName: 'Coal API2 CIF ARA', pointId: null, exceptionType: 'stale', severity: 'low', description: 'Weekly update delayed by 2 days', impactedBooks: ['Coal Desk'], estimatedMtmImpact: 180000, status: 'open', createdAt: '2026-02-21T09:30:00Z' },
  { id: 'e9', curveId: 'c9', curveName: 'TTF Front Month', pointId: 'p21', exceptionType: 'outlier', severity: 'high', description: 'Daily move >4σ on geopolitical headline', impactedBooks: ['EU Gas Trading', 'LNG'], estimatedMtmImpact: 1860000, status: 'acknowledged', createdAt: '2026-02-21T07:05:00Z' },
  { id: 'e10', curveId: 'c11', curveName: 'JKM LNG', pointId: null, exceptionType: 'cross_check_fail', severity: 'medium', description: 'Broker quote vs exchange settle delta > 1.5%', impactedBooks: ['LNG Trading'], estimatedMtmImpact: 720000, status: 'open', createdAt: '2026-02-21T05:30:00Z' },
  { id: 'e11', curveId: 'c14', curveName: 'ERCOT North DA', pointId: 'p27', exceptionType: 'outlier', severity: 'high', description: 'Aug-26 settle +6.7% vs prior close on weather forecast', impactedBooks: ['Power Trading'], estimatedMtmImpact: 1420000, status: 'open', createdAt: '2026-02-21T06:35:00Z' },
  { id: 'e12', curveId: 'c14', curveName: 'ERCOT North DA', pointId: null, exceptionType: 'missing_tenor', severity: 'medium', description: '4 hourly intervals missing for 02/19 (HE 17-20)', impactedBooks: ['Power Trading'], estimatedMtmImpact: 380000, status: 'resolved', createdAt: '2026-02-20T07:00:00Z' },
  { id: 'e13', curveId: 'c15', curveName: 'CAISO SP15 DA', pointId: null, exceptionType: 'gap', severity: 'low', description: 'Solar zero-print blocks not back-filled', impactedBooks: ['Power West'], estimatedMtmImpact: 95000, status: 'suppressed', createdAt: '2026-02-20T22:00:00Z' },
  { id: 'e14', curveId: 'c17', curveName: 'USD/JPY Spot', pointId: null, exceptionType: 'outlier', severity: 'medium', description: 'Intraday spike on BoJ surprise', impactedBooks: ['Treasury', 'JP Trading'], estimatedMtmImpact: 260000, status: 'open', createdAt: '2026-02-20T03:15:00Z' },
  { id: 'e15', curveId: 'c18', curveName: 'Silver London Fix', pointId: null, exceptionType: 'stale', severity: 'low', description: 'PM fix not received from publisher', impactedBooks: ['Metals'], estimatedMtmImpact: 45000, status: 'acknowledged', createdAt: '2026-02-21T11:00:00Z' },
  { id: 'e16', curveId: 'c20', curveName: 'EUA Carbon Dec', pointId: null, exceptionType: 'monotonicity', severity: 'medium', description: 'Dec-26 vs Dec-27 spread inverted intraday', impactedBooks: ['Carbon Desk'], estimatedMtmImpact: 410000, status: 'open', createdAt: '2026-02-21T09:55:00Z' },
  { id: 'e17', curveId: 'c10', curveName: 'NBP Day-Ahead', pointId: null, exceptionType: 'cross_check_fail', severity: 'low', description: 'NBP vs TTF FX-adjusted delta out of band', impactedBooks: ['UK Gas'], estimatedMtmImpact: 88000, status: 'resolved', createdAt: '2026-02-19T08:00:00Z' },
  { id: 'e18', curveId: 'c21', curveName: 'CCA California Carbon', pointId: null, exceptionType: 'stale', severity: 'medium', description: 'Curve inactive — last update Jan-31', impactedBooks: ['Carbon West'], estimatedMtmImpact: 0, status: 'open', createdAt: '2026-02-21T12:00:00Z' },
];

const demoLockAudit: LockAuditEntry[] = [
  { id: 'la1', curveName: 'WTI Front Month', periodStart: '2026-02-01', periodEnd: '2026-02-21', action: 'lock', performedBy: 'John Smith', performedAt: '2026-02-21T09:00:00Z', reason: 'Month-end close', pointsAffected: 21 },
  { id: 'la2', curveName: 'Brent M+1', periodStart: '2026-01-01', periodEnd: '2026-01-31', action: 'lock', performedBy: 'Jane Doe', performedAt: '2026-02-01T08:00:00Z', reason: 'January close completed', pointsAffected: 31 },
  { id: 'la3', curveName: 'Henry Hub NG', periodStart: '2026-02-15', periodEnd: '2026-02-15', action: 'unlock', performedBy: 'Admin User', performedAt: '2026-02-16T10:00:00Z', reason: 'Correction required - vendor restatement', pointsAffected: 1 },
  { id: 'la4', curveName: 'EUR/USD Spot', periodStart: '2026-02-01', periodEnd: '2026-02-20', action: 'lock', performedBy: 'Treasury Ops', performedAt: '2026-02-20T17:30:00Z', reason: 'Standard daily lock', pointsAffected: 20 },
  { id: 'la5', curveName: 'Gold London Fix', periodStart: '2026-01-01', periodEnd: '2026-02-21', action: 'lock', performedBy: 'Jane Doe', performedAt: '2026-02-21T10:45:00Z', reason: 'Full YTD lock for audit', pointsAffected: 38 },
  { id: 'la6', curveName: 'TTF Front Month', periodStart: '2026-02-01', periodEnd: '2026-02-20', action: 'lock', performedBy: 'EU Desk', performedAt: '2026-02-21T07:30:00Z', reason: 'Daily EOD lock', pointsAffected: 14 },
  { id: 'la7', curveName: 'TTF Front Month', periodStart: '2026-02-10', periodEnd: '2026-02-10', action: 'unlock', performedBy: 'Admin User', performedAt: '2026-02-12T11:00:00Z', reason: 'Correction post month-start re-fixing', pointsAffected: 1 },
  { id: 'la8', curveName: 'JKM LNG', periodStart: '2026-01-01', periodEnd: '2026-01-31', action: 'lock', performedBy: 'LNG Desk', performedAt: '2026-02-02T05:30:00Z', reason: 'January LNG close', pointsAffected: 21 },
  { id: 'la9', curveName: 'PJM West Hub DA', periodStart: '2026-02-01', periodEnd: '2026-02-19', action: 'lock', performedBy: 'Power Ops', performedAt: '2026-02-20T07:00:00Z', reason: 'Daily DA lock', pointsAffected: 19 },
  { id: 'la10', curveName: 'ERCOT North DA', periodStart: '2026-02-01', periodEnd: '2026-02-19', action: 'lock', performedBy: 'Power Ops', performedAt: '2026-02-20T07:05:00Z', reason: 'Daily DA lock', pointsAffected: 19 },
  { id: 'la11', curveName: 'EUA Carbon Dec', periodStart: '2026-02-01', periodEnd: '2026-02-21', action: 'lock', performedBy: 'Carbon Desk', performedAt: '2026-02-21T10:10:00Z', reason: 'Compliance period lock', pointsAffected: 15 },
  { id: 'la12', curveName: 'LME Copper 3M', periodStart: '2026-02-01', periodEnd: '2026-02-21', action: 'lock', performedBy: 'Metals Desk', performedAt: '2026-02-21T10:50:00Z', reason: 'Standard daily lock', pointsAffected: 15 },
  { id: 'la13', curveName: 'CCA California Carbon', periodStart: '2026-01-01', periodEnd: '2026-01-31', action: 'lock', performedBy: 'Carbon West', performedAt: '2026-02-01T18:00:00Z', reason: 'Curve being decommissioned', pointsAffected: 1 },
];

export function useMarketData() {
  const [filters, setFilters] = useState<MarketDataFilters>({
    commodity: 'all',
    source: 'all',
    status: 'all',
    search: '',
  });
  const [selectedCurveId, setSelectedCurveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'curves' | 'exceptions' | 'locks' | 'audit'>('curves');

  const filteredCurves = useMemo(() => {
    return demoCurves.filter((c) => {
      if (filters.commodity !== 'all' && c.commodity !== filters.commodity) return false;
      if (filters.source !== 'all' && c.source !== filters.source) return false;
      if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  const selectedCurve = useMemo(() => demoCurves.find(c => c.id === selectedCurveId) ?? null, [selectedCurveId]);
  const selectedCurvePoints = useMemo(() => demoPoints.filter(p => p.curveId === selectedCurveId), [selectedCurveId]);

  const filteredExceptions = useMemo(() => {
    return demoExceptions.filter((e) => {
      if (filters.status !== 'all' && e.status !== filters.status) return false;
      if (filters.commodity !== 'all') {
        const curve = demoCurves.find(c => c.id === e.curveId);
        if (curve && curve.commodity !== filters.commodity) return false;
      }
      return true;
    });
  }, [filters]);

  const kpis = useMemo(() => {
    const openExceptions = demoExceptions.filter(e => e.status === 'open');
    const totalOutliers = demoExceptions.filter(e => e.exceptionType === 'outlier').length;
    const totalPoints = demoCurves.reduce((s, c) => s + c.pointCount, 0);
    const totalLocked = demoCurves.reduce((s, c) => s + c.lockedCount, 0);
    const lockedPct = totalPoints > 0 ? (totalLocked / totalPoints) * 100 : 0;
    const totalMtmImpact = openExceptions.reduce((s, e) => s + (e.estimatedMtmImpact ?? 0), 0);
    return {
      totalCurves: demoCurves.length,
      openExceptions: openExceptions.length,
      totalOutliers,
      lockedPct: Math.round(lockedPct * 10) / 10,
      estimatedMtmImpact: totalMtmImpact,
      staleCount: demoExceptions.filter(e => e.exceptionType === 'stale' && e.status !== 'resolved').length,
    };
  }, []);

  return {
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    curves: filteredCurves,
    exceptions: filteredExceptions,
    lockAudit: demoLockAudit,
    selectedCurve,
    selectedCurvePoints: selectedCurvePoints,
    selectedCurveId,
    setSelectedCurveId,
    kpis,
  };
}

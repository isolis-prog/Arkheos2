/**
 * Client-side mirror of the match-confirmations edge function logic.
 * Used by the matching simulator (no DB writes — pure preview).
 */

import { canonicalizeFieldValue } from './fieldCanonicalizers';

export type MatchType =
  | 'exact'
  | 'case_insensitive'
  | 'normalized'
  | 'numeric_tolerance'
  | 'date_tolerance';

export type FieldCategory = 'economic' | 'temporal' | 'legal' | 'settlement' | 'reference_data' | 'other';

export interface FieldRule {
  fieldName: string;
  fieldCategory: FieldCategory;
  matchType: MatchType;
  toleranceValue?: number | null;
  toleranceUnit?: string | null;
  isMaterialByDefault: boolean;
}

export interface SimDoc {
  externalRef: string;
  counterpartyId?: string | null;
  tradeDate?: string | null;
  productCode?: string | null;
  notional?: number | null;
  attributes: Record<string, unknown>;
}

export interface SimDiscrepancy {
  fieldName: string;
  fieldCategory: FieldCategory;
  ourValue: string | null;
  counterpartyValue: string | null;
  ourNormalized: string;
  counterpartyNormalized: string;
  isMaterial: boolean;
  toleranceApplied: string;
  type: 'mismatch' | 'format_only' | 'missing_our_side' | 'missing_their_side';
}

export interface SimPair {
  pairKey: string;
  ourDoc: SimDoc | null;
  counterpartyDoc: SimDoc | null;
  stage: 'matched' | 'disputed' | 'awaiting_us' | 'awaiting_counterparty';
  discrepancies: SimDiscrepancy[];
  fieldDiscrepancyCount: number;
  materialDiscrepancyCount: number;
}

export interface SimResult {
  pairs: SimPair[];
  unmatchedOurs: SimDoc[];
  unmatchedTheirs: SimDoc[];
  matched: number;
  disputed: number;
  awaitingUs: number;
  awaitingCpty: number;
  rulesUsed: number;
}

export const DEFAULT_FIELD_RULES: FieldRule[] = [
  { fieldName: 'notional', fieldCategory: 'economic', matchType: 'numeric_tolerance', toleranceValue: 0.0001, toleranceUnit: 'pct', isMaterialByDefault: true },
  { fieldName: 'price', fieldCategory: 'economic', matchType: 'numeric_tolerance', toleranceValue: 0.00001, toleranceUnit: 'pct', isMaterialByDefault: true },
  { fieldName: 'fixed_rate', fieldCategory: 'economic', matchType: 'numeric_tolerance', toleranceValue: 0.000001, toleranceUnit: 'pct', isMaterialByDefault: true },
  { fieldName: 'currency', fieldCategory: 'economic', matchType: 'exact', isMaterialByDefault: true },
  { fieldName: 'effective_date', fieldCategory: 'temporal', matchType: 'date_tolerance', toleranceValue: 0, toleranceUnit: 'days', isMaterialByDefault: true },
  { fieldName: 'termination_date', fieldCategory: 'temporal', matchType: 'date_tolerance', toleranceValue: 0, toleranceUnit: 'days', isMaterialByDefault: true },
  { fieldName: 'payment_frequency', fieldCategory: 'temporal', matchType: 'normalized', isMaterialByDefault: true },
  { fieldName: 'day_count', fieldCategory: 'legal', matchType: 'normalized', isMaterialByDefault: false },
  { fieldName: 'business_day_convention', fieldCategory: 'legal', matchType: 'normalized', isMaterialByDefault: false },
  { fieldName: 'settlement_type', fieldCategory: 'settlement', matchType: 'normalized', isMaterialByDefault: true },
  { fieldName: 'settlement_cycle', fieldCategory: 'settlement', matchType: 'normalized', isMaterialByDefault: true },
];

// `normalize` is the bare A-Z0-9 normalizer used as a fallback when no field-
// specific canonicalizer is registered. Field canonicalization (BDC, settlement,
// payment frequency aliases) goes through `canonicalizeFieldValue`.
function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function describeTolerance(rule: FieldRule): string {
  if (rule.toleranceValue == null) return rule.matchType;
  return `${rule.matchType}:${rule.toleranceValue}${rule.toleranceUnit ?? ''}`;
}

function compareValues(rule: FieldRule, ourVal: unknown, theirVal: unknown):
  | { isMismatch: false }
  | {
      isMismatch: true;
      isMaterial: boolean;
      type: SimDiscrepancy['type'];
      ourNorm: string;
      theirNorm: string;
    } {
  if ((ourVal === undefined || ourVal === null) && (theirVal === undefined || theirVal === null)) {
    return { isMismatch: false };
  }
  if (ourVal === undefined || ourVal === null) {
    return { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'missing_our_side', ourNorm: '', theirNorm: String(theirVal ?? '') };
  }
  if (theirVal === undefined || theirVal === null) {
    return { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'missing_their_side', ourNorm: String(ourVal), theirNorm: '' };
  }

  const ourStr = String(ourVal);
  const theirStr = String(theirVal);

  switch (rule.matchType) {
    case 'exact': {
      const eq = ourStr === theirStr;
      return eq ? { isMismatch: false } : { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: ourStr, theirNorm: theirStr };
    }
    case 'case_insensitive': {
      const eq = ourStr.toLowerCase() === theirStr.toLowerCase();
      return eq
        ? { isMismatch: false }
        : { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: ourStr.toLowerCase(), theirNorm: theirStr.toLowerCase() };
    }
    case 'normalized': {
      // Field-aware canonicalization (BDC aliases, settlement, frequency)
      // falls back to bare A-Z0-9 normalization for unknown fields.
      const a = canonicalizeFieldValue(rule.fieldName, ourVal);
      const b = canonicalizeFieldValue(rule.fieldName, theirVal);
      const eq = a === b;
      const rawDiffers = ourStr !== theirStr;
      if (eq && !rawDiffers) return { isMismatch: false };
      return {
        isMismatch: true,
        isMaterial: !eq && rule.isMaterialByDefault,
        type: eq ? 'format_only' : 'mismatch',
        ourNorm: a,
        theirNorm: b,
      };
    }
    case 'numeric_tolerance': {
      const a = Number(ourVal);
      const b = Number(theirVal);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: ourStr, theirNorm: theirStr };
      }
      const tol = rule.toleranceValue ?? 0;
      const base = Math.max(Math.abs(a), Math.abs(b), 1);
      const within = Math.abs(a - b) / base <= tol;
      return within
        ? { isMismatch: false }
        : { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: a.toString(), theirNorm: b.toString() };
    }
    case 'date_tolerance': {
      const a = new Date(ourStr).getTime();
      const b = new Date(theirStr).getTime();
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: ourStr, theirNorm: theirStr };
      }
      const tolDays = rule.toleranceValue ?? 0;
      const within = Math.abs(a - b) / 86400000 <= tolDays;
      return within
        ? { isMismatch: false }
        : { isMismatch: true, isMaterial: rule.isMaterialByDefault, type: 'mismatch', ourNorm: ourStr, theirNorm: theirStr };
    }
  }
}

function pairKey(d: SimDoc): string {
  return `${d.counterpartyId ?? '_'}|${d.tradeDate ?? '_'}|${d.productCode ?? '_'}`;
}

export function simulateMatching(
  ours: SimDoc[],
  theirs: SimDoc[],
  rules: FieldRule[] = DEFAULT_FIELD_RULES,
): SimResult {
  const oursMap = new Map<string, SimDoc[]>();
  const theirsMap = new Map<string, SimDoc[]>();
  ours.forEach((d) => {
    const k = pairKey(d);
    const arr = oursMap.get(k) ?? [];
    arr.push(d);
    oursMap.set(k, arr);
  });
  theirs.forEach((d) => {
    const k = pairKey(d);
    const arr = theirsMap.get(k) ?? [];
    arr.push(d);
    theirsMap.set(k, arr);
  });

  const allKeys = new Set<string>([...oursMap.keys(), ...theirsMap.keys()]);
  const pairs: SimPair[] = [];
  const unmatchedOurs: SimDoc[] = [];
  const unmatchedTheirs: SimDoc[] = [];

  let matched = 0,
    disputed = 0,
    awaitingUs = 0,
    awaitingCpty = 0;

  allKeys.forEach((k) => {
    const o = (oursMap.get(k) ?? [])[0] ?? null;
    const t = (theirsMap.get(k) ?? [])[0] ?? null;

    if (!o && t) {
      unmatchedTheirs.push(t);
      pairs.push({
        pairKey: k,
        ourDoc: null,
        counterpartyDoc: t,
        stage: 'awaiting_us',
        discrepancies: [],
        fieldDiscrepancyCount: 0,
        materialDiscrepancyCount: 0,
      });
      awaitingUs += 1;
      return;
    }
    if (o && !t) {
      unmatchedOurs.push(o);
      pairs.push({
        pairKey: k,
        ourDoc: o,
        counterpartyDoc: null,
        stage: 'awaiting_counterparty',
        discrepancies: [],
        fieldDiscrepancyCount: 0,
        materialDiscrepancyCount: 0,
      });
      awaitingCpty += 1;
      return;
    }
    if (!o || !t) return;

    const discrepancies: SimDiscrepancy[] = [];
    let fieldDisc = 0;
    let materialDisc = 0;
    rules.forEach((rule) => {
      const ourVal = o.attributes[rule.fieldName];
      const theirVal = t.attributes[rule.fieldName];
      const cmp = compareValues(rule, ourVal, theirVal);
      if (!cmp.isMismatch) return;
      fieldDisc += 1;
      if (cmp.isMaterial) materialDisc += 1;
      discrepancies.push({
        fieldName: rule.fieldName,
        fieldCategory: rule.fieldCategory,
        ourValue: cmp.type === 'missing_our_side' ? null : String(ourVal ?? ''),
        counterpartyValue: cmp.type === 'missing_their_side' ? null : String(theirVal ?? ''),
        ourNormalized: cmp.ourNorm,
        counterpartyNormalized: cmp.theirNorm,
        isMaterial: cmp.isMaterial,
        toleranceApplied: describeTolerance(rule),
        type: cmp.type,
      });
    });

    const stage: SimPair['stage'] = materialDisc > 0 ? 'disputed' : 'matched';
    if (stage === 'matched') matched += 1;
    else disputed += 1;

    pairs.push({
      pairKey: k,
      ourDoc: o,
      counterpartyDoc: t,
      stage,
      discrepancies,
      fieldDiscrepancyCount: fieldDisc,
      materialDiscrepancyCount: materialDisc,
    });
  });

  return { pairs, unmatchedOurs, unmatchedTheirs, matched, disputed, awaitingUs, awaitingCpty, rulesUsed: rules.length };
}

export function parseFileContent(filename: string, content: string): SimDoc[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((row, i) => normalizeRow(row, i));
  }
  return parseCSV(content);
}

function normalizeRow(row: Record<string, unknown>, i: number): SimDoc {
  const externalRef = String(row.external_ref ?? row.externalRef ?? row.id ?? `row-${i + 1}`);
  const counterpartyId = (row.counterparty_id ?? row.counterpartyId ?? null) as string | null;
  const tradeDate = (row.trade_date ?? row.tradeDate ?? null) as string | null;
  const productCode = (row.product_code ?? row.productCode ?? null) as string | null;
  const notional = row.notional != null ? Number(row.notional) : null;
  const attributes = (row.attributes && typeof row.attributes === 'object'
    ? (row.attributes as Record<string, unknown>)
    : { ...row });
  // Promote known top-level fields into attributes too for matching
  if (notional != null && attributes.notional == null) attributes.notional = notional;
  return { externalRef, counterpartyId, tradeDate, productCode, notional, attributes };
}

function parseCSV(content: string): SimDoc[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line, i) => {
    const cols = splitCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const v = cols[idx];
      if (v === undefined || v === '') return;
      const num = Number(v);
      row[h] = !Number.isNaN(num) && v.trim() !== '' && /^-?\d/.test(v) ? num : v;
    });
    return normalizeRow(row, i);
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

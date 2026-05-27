/**
 * Canonicalization mappings for confirmation field values.
 *
 * The matching engine compares trade capture vs counterparty confirmations.
 * Counterparties send the same business term in many shapes — "MF",
 * "Modified Following", "ModFol", etc. — that are semantically identical
 * but textually different. These canonicalizers fold each known alias into
 * a single canonical token so `match_type='normalized'` does not flag a
 * spurious mismatch.
 *
 * Every canonicalizer follows the same contract:
 *   - input:  any user/system supplied value (string / number / null)
 *   - output: canonical UPPER_SNAKE_CASE token, or '' for empty input,
 *             or the bare-normalized value if no alias is recognized
 *             (so unknown values still degrade gracefully).
 */

/** Strip everything but A-Z and 0-9, uppercase. Mirrors the engine's normalize(). */
export function bareNormalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ---------- Business Day Convention ----------
// Canonical tokens based on ISDA / FpML BusinessDayConventionEnum.
export const BDC_CANONICAL = {
  FOLLOWING: 'FOLLOWING',
  MODIFIED_FOLLOWING: 'MODIFIED_FOLLOWING',
  PRECEDING: 'PRECEDING',
  MODIFIED_PRECEDING: 'MODIFIED_PRECEDING',
  NONE: 'NONE',
  NEAREST: 'NEAREST',
} as const;

const BDC_ALIASES: Record<string, string> = {
  // Following
  F: BDC_CANONICAL.FOLLOWING,
  FOL: BDC_CANONICAL.FOLLOWING,
  FOLLOWING: BDC_CANONICAL.FOLLOWING,
  FLW: BDC_CANONICAL.FOLLOWING,
  // Modified Following
  MF: BDC_CANONICAL.MODIFIED_FOLLOWING,
  MODF: BDC_CANONICAL.MODIFIED_FOLLOWING,
  MODFOL: BDC_CANONICAL.MODIFIED_FOLLOWING,
  MODFOLLOWING: BDC_CANONICAL.MODIFIED_FOLLOWING,
  MODIFIEDFOLLOWING: BDC_CANONICAL.MODIFIED_FOLLOWING,
  MODFLW: BDC_CANONICAL.MODIFIED_FOLLOWING,
  // Preceding
  P: BDC_CANONICAL.PRECEDING,
  PREC: BDC_CANONICAL.PRECEDING,
  PRECEDING: BDC_CANONICAL.PRECEDING,
  PRV: BDC_CANONICAL.PRECEDING,
  PREVIOUS: BDC_CANONICAL.PRECEDING,
  // Modified Preceding
  MP: BDC_CANONICAL.MODIFIED_PRECEDING,
  MODP: BDC_CANONICAL.MODIFIED_PRECEDING,
  MODPREC: BDC_CANONICAL.MODIFIED_PRECEDING,
  MODIFIEDPRECEDING: BDC_CANONICAL.MODIFIED_PRECEDING,
  MODPREV: BDC_CANONICAL.MODIFIED_PRECEDING,
  // None
  NONE: BDC_CANONICAL.NONE,
  NA: BDC_CANONICAL.NONE,
  NOADJUSTMENT: BDC_CANONICAL.NONE,
  NOADJ: BDC_CANONICAL.NONE,
  // Nearest
  NEAR: BDC_CANONICAL.NEAREST,
  NEAREST: BDC_CANONICAL.NEAREST,
};

export function canonicalBusinessDayConvention(value: unknown): string {
  const k = bareNormalize(value);
  if (!k) return '';
  return BDC_ALIASES[k] ?? k;
}

// ---------- Settlement Type & Cycle ----------
// Canonical tokens for `settlement_type` (cash vs physical) and `settlement_cycle`
// (T+0, T+1, T+2 …). The matching engine treats them as separate fields, so we
// expose a canonicalizer per concern plus a unified helper that handles inputs
// that mix both (e.g. "Physical Delivery T+2").
export const SETTLEMENT_TYPE_CANONICAL = {
  CASH: 'CASH',
  PHYSICAL: 'PHYSICAL',
  ELECT: 'ELECTIVE',
  NET: 'NET_CASH',
} as const;

const SETTLEMENT_TYPE_ALIASES: Record<string, string> = {
  CASH: SETTLEMENT_TYPE_CANONICAL.CASH,
  CASHSETTLED: SETTLEMENT_TYPE_CANONICAL.CASH,
  CASHSETTLEMENT: SETTLEMENT_TYPE_CANONICAL.CASH,
  CSH: SETTLEMENT_TYPE_CANONICAL.CASH,
  PHYS: SETTLEMENT_TYPE_CANONICAL.PHYSICAL,
  PHYSICAL: SETTLEMENT_TYPE_CANONICAL.PHYSICAL,
  PHYSICALDELIVERY: SETTLEMENT_TYPE_CANONICAL.PHYSICAL,
  PHYSDEL: SETTLEMENT_TYPE_CANONICAL.PHYSICAL,
  DELIVERY: SETTLEMENT_TYPE_CANONICAL.PHYSICAL,
  ELECTIVE: SETTLEMENT_TYPE_CANONICAL.ELECT,
  OPTIONAL: SETTLEMENT_TYPE_CANONICAL.ELECT,
  NETCASH: SETTLEMENT_TYPE_CANONICAL.NET,
  NETSETTLEMENT: SETTLEMENT_TYPE_CANONICAL.NET,
  NETTED: SETTLEMENT_TYPE_CANONICAL.NET,
};

export function canonicalSettlementType(value: unknown): string {
  const k = bareNormalize(value);
  if (!k) return '';
  return SETTLEMENT_TYPE_ALIASES[k] ?? k;
}

/**
 * Canonicalize settlement cycle values into the `T+N` form, with `SAMEDAY`
 * collapsing to `T+0`. Accepts inputs like "T+2", "t plus 2", "2D",
 * "Same Day", "SD", "T0".
 */
export function canonicalSettlementCycle(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value).trim().toUpperCase();
  // Same-day shortcuts
  if (/^(SAMEDAY|SAME[-_ ]?DAY|SD|TODAY|T\+?0|T0)$/.test(raw.replace(/\s+/g, ''))) {
    return 'T+0';
  }
  // Match "T+N" / "T N" / "T plus N"
  const tplus = raw.match(/T\s*[+\-]?\s*PLUS\s*(\d+)/) || raw.match(/T\s*[+\-]?\s*(\d+)/);
  if (tplus) return `T+${parseInt(tplus[1], 10)}`;
  // Bare "ND" / "N DAYS"
  const days = raw.match(/^(\d+)\s*D(AYS?)?$/);
  if (days) return `T+${parseInt(days[1], 10)}`;
  // Spot conventions
  if (/^SPOT$/.test(raw)) return 'T+2';
  return bareNormalize(raw);
}

// ---------- Payment Frequency ----------
// Canonical token form: integer count + period unit, where unit ∈ {D, W, M, Y}.
// Bullet / single payment at maturity collapses to BULLET.
export const PAYMENT_FREQ_CANONICAL = {
  BULLET: 'BULLET',
} as const;

const PAYMENT_FREQ_ALIASES: Record<string, string> = {
  // Daily
  D: '1D',
  DAILY: '1D',
  // Weekly
  W: '1W',
  WEEKLY: '1W',
  BW: '2W',
  BIWEEKLY: '2W',
  FORTNIGHTLY: '2W',
  // Monthly family
  M: '1M',
  MTH: '1M',
  MONTHLY: '1M',
  '1M': '1M',
  BM: '2M',
  BIMONTHLY: '2M',
  '2M': '2M',
  // Quarterly
  Q: '3M',
  QTR: '3M',
  QUARTERLY: '3M',
  '3M': '3M',
  // Semi-annual
  S: '6M',
  SA: '6M',
  SEMIANNUAL: '6M',
  SEMIANNUALLY: '6M',
  HALFYEARLY: '6M',
  '6M': '6M',
  // Annual
  A: '1Y',
  Y: '1Y',
  ANNUAL: '1Y',
  ANNUALLY: '1Y',
  YEARLY: '1Y',
  '1Y': '1Y',
  '12M': '1Y',
  // Bullet / single payment
  BULLET: PAYMENT_FREQ_CANONICAL.BULLET,
  ATMATURITY: PAYMENT_FREQ_CANONICAL.BULLET,
  SINGLE: PAYMENT_FREQ_CANONICAL.BULLET,
  ZEROCOUPON: PAYMENT_FREQ_CANONICAL.BULLET,
  ZC: PAYMENT_FREQ_CANONICAL.BULLET,
  ONETIME: PAYMENT_FREQ_CANONICAL.BULLET,
  ONESHOT: PAYMENT_FREQ_CANONICAL.BULLET,
};

export function canonicalPaymentFrequency(value: unknown): string {
  const k = bareNormalize(value);
  if (!k) return '';
  if (PAYMENT_FREQ_ALIASES[k]) return PAYMENT_FREQ_ALIASES[k];
  // Generic "<N><UNIT>" form, e.g. 4M -> 4M
  const m = k.match(/^(\d+)([DWMY])$/);
  if (m) return `${parseInt(m[1], 10)}${m[2]}`;
  return k;
}

// ---------- Field router ----------
// Map field_name → canonicalizer. Used by both the client simulator and the
// edge matching engine so a single source of truth governs alias folding.
export type FieldCanonicalizer = (value: unknown) => string;

const FIELD_CANONICALIZERS: Record<string, FieldCanonicalizer> = {
  business_day_convention: canonicalBusinessDayConvention,
  bdc: canonicalBusinessDayConvention,
  settlement_type: canonicalSettlementType,
  settlement_cycle: canonicalSettlementCycle,
  payment_frequency: canonicalPaymentFrequency,
  pay_freq: canonicalPaymentFrequency,
  fixed_leg_payment_frequency: canonicalPaymentFrequency,
  floating_leg_payment_frequency: canonicalPaymentFrequency,
};

export function canonicalizeFieldValue(fieldName: string, value: unknown): string {
  const fn = FIELD_CANONICALIZERS[fieldName?.toLowerCase?.() ?? ''];
  return fn ? fn(value) : bareNormalize(value);
}

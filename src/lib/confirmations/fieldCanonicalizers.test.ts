import { describe, it, expect } from 'vitest';
import {
  canonicalBusinessDayConvention,
  canonicalSettlementType,
  canonicalSettlementCycle,
  canonicalPaymentFrequency,
  canonicalizeFieldValue,
} from './fieldCanonicalizers';

describe('canonicalBusinessDayConvention', () => {
  it.each([
    ['MF', 'MODIFIED_FOLLOWING'],
    ['Modified Following', 'MODIFIED_FOLLOWING'],
    ['mod-fol', 'MODIFIED_FOLLOWING'],
    ['ModFollowing', 'MODIFIED_FOLLOWING'],
    ['F', 'FOLLOWING'],
    ['Following', 'FOLLOWING'],
    ['P', 'PRECEDING'],
    ['Previous', 'PRECEDING'],
    ['MP', 'MODIFIED_PRECEDING'],
    ['No Adjustment', 'NONE'],
    ['Nearest', 'NEAREST'],
  ])('maps "%s" -> %s', (input, expected) => {
    expect(canonicalBusinessDayConvention(input)).toBe(expected);
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(canonicalBusinessDayConvention(null)).toBe('');
    expect(canonicalBusinessDayConvention(undefined)).toBe('');
    expect(canonicalBusinessDayConvention('')).toBe('');
  });

  it('passes through unknown values via bare-normalize', () => {
    expect(canonicalBusinessDayConvention('Custom-XYZ')).toBe('CUSTOMXYZ');
  });
});

describe('canonicalSettlementType', () => {
  it.each([
    ['Cash', 'CASH'],
    ['cash settled', 'CASH'],
    ['Physical', 'PHYSICAL'],
    ['Physical Delivery', 'PHYSICAL'],
    ['PhysDel', 'PHYSICAL'],
    ['Net Cash', 'NET_CASH'],
    ['Elective', 'ELECTIVE'],
  ])('maps "%s" -> %s', (input, expected) => {
    expect(canonicalSettlementType(input)).toBe(expected);
  });
});

describe('canonicalSettlementCycle', () => {
  it.each([
    ['T+0', 'T+0'],
    ['Same Day', 'T+0'],
    ['SAMEDAY', 'T+0'],
    ['SD', 'T+0'],
    ['T+1', 'T+1'],
    ['T + 2', 'T+2'],
    ['T plus 3', 'T+3'],
    ['2D', 'T+2'],
    ['5 days', 'T+5'],
    ['Spot', 'T+2'],
  ])('maps "%s" -> %s', (input, expected) => {
    expect(canonicalSettlementCycle(input)).toBe(expected);
  });
});

describe('canonicalPaymentFrequency', () => {
  it.each([
    ['M', '1M'],
    ['1M', '1M'],
    ['Monthly', '1M'],
    ['Q', '3M'],
    ['Quarterly', '3M'],
    ['3M', '3M'],
    ['S', '6M'],
    ['Semi-Annual', '6M'],
    ['SA', '6M'],
    ['6M', '6M'],
    ['A', '1Y'],
    ['Annual', '1Y'],
    ['Yearly', '1Y'],
    ['12M', '1Y'],
    ['Bullet', 'BULLET'],
    ['At Maturity', 'BULLET'],
    ['Zero Coupon', 'BULLET'],
    ['Daily', '1D'],
    ['W', '1W'],
    ['Bi-Weekly', '2W'],
    ['4M', '4M'], // generic <N><unit> fall-through
  ])('maps "%s" -> %s', (input, expected) => {
    expect(canonicalPaymentFrequency(input)).toBe(expected);
  });
});

describe('canonicalizeFieldValue (router)', () => {
  it('routes BDC variants through the BDC canonicalizer', () => {
    expect(canonicalizeFieldValue('business_day_convention', 'MF')).toBe('MODIFIED_FOLLOWING');
    expect(canonicalizeFieldValue('business_day_convention', 'Modified Following')).toBe('MODIFIED_FOLLOWING');
  });

  it('routes settlement_type aliases', () => {
    expect(canonicalizeFieldValue('settlement_type', 'CASH SETTLED')).toBe('CASH');
    expect(canonicalizeFieldValue('settlement_type', 'PhysDel')).toBe('PHYSICAL');
  });

  it('routes settlement_cycle aliases', () => {
    expect(canonicalizeFieldValue('settlement_cycle', 'Same Day')).toBe('T+0');
    expect(canonicalizeFieldValue('settlement_cycle', 'T+2')).toBe('T+2');
  });

  it('routes payment_frequency aliases for fixed and floating legs', () => {
    expect(canonicalizeFieldValue('payment_frequency', 'Q')).toBe('3M');
    expect(canonicalizeFieldValue('fixed_leg_payment_frequency', 'Quarterly')).toBe('3M');
    expect(canonicalizeFieldValue('floating_leg_payment_frequency', 'S')).toBe('6M');
  });

  it('falls back to bare-normalize for unknown fields', () => {
    expect(canonicalizeFieldValue('counterparty_name', 'Goldman Sachs')).toBe('GOLDMANSACHS');
  });
});

describe('matching-engine integration via canonicalization', () => {
  it('treats "MF" and "Modified Following" as equal for BDC', () => {
    const a = canonicalizeFieldValue('business_day_convention', 'MF');
    const b = canonicalizeFieldValue('business_day_convention', 'Modified Following');
    expect(a).toBe(b);
  });

  it('treats "Q", "3M" and "Quarterly" as equal for payment_frequency', () => {
    const q = canonicalizeFieldValue('payment_frequency', 'Q');
    const m = canonicalizeFieldValue('payment_frequency', '3M');
    const qq = canonicalizeFieldValue('payment_frequency', 'Quarterly');
    expect(q).toBe('3M');
    expect(m).toBe('3M');
    expect(qq).toBe('3M');
  });

  it('treats "Same Day", "SAMEDAY" and "T+0" as equal for settlement_cycle', () => {
    expect(canonicalizeFieldValue('settlement_cycle', 'Same Day')).toBe('T+0');
    expect(canonicalizeFieldValue('settlement_cycle', 'SAMEDAY')).toBe('T+0');
    expect(canonicalizeFieldValue('settlement_cycle', 'T+0')).toBe('T+0');
  });

  it('detects a real BDC mismatch (Following vs Preceding)', () => {
    const a = canonicalizeFieldValue('business_day_convention', 'Following');
    const b = canonicalizeFieldValue('business_day_convention', 'Preceding');
    expect(a).not.toBe(b);
  });
});

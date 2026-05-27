import { useState, useMemo } from 'react';
import { subDays, format } from 'date-fns';

export interface BankTxn {
  id: string;
  bankTxnId: string;
  valueDate: string;
  amount: number;
  currency: string;
  counterpartyText: string;
  remittanceText: string;
  bankRef: string;
  bankAccount: string;
  direction: 'credit' | 'debit';
  statementFormat: string;
  isMatched: boolean;
}

export interface PaymentMatch {
  id: string;
  bankTxnId: string;
  bankTxnRef: string;
  invoiceRef: string;
  matchType: 'exact' | 'fuzzy' | 'manual' | 'partial';
  matchScore: number;
  matchedAmount: number;
  remainingAmount: number;
  currency: string;
  bankAmount: number;
  invoiceAmount: number;
  counterparty: string;
  differences: { field: string; bankValue: string; erpValue: string }[];
  status: 'proposed' | 'accepted' | 'rejected' | 'split';
  exceptionType: string | null;
  ownerRole: string;
  valueDate: string;
}

const CPS = ['Shell Trading', 'BP Oil International', 'Vitol SA', 'Trafigura Pte', 'Glencore Energy', 'Cargill Inc', 'Gunvor Group'];
const BANKS = ['JPM-USD-001', 'HSBC-EUR-002', 'Citi-GBP-003', 'DB-USD-004'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];

function generateData() {
  const txns: BankTxn[] = [];
  const matches: PaymentMatch[] = [];

  for (let i = 0; i < 45; i++) {
    const amt = Math.round((10000 + Math.random() * 500000) * 100) / 100;
    const cp = CPS[i % CPS.length];
    const cur = CURRENCIES[i % 3];
    const date = format(subDays(new Date(), Math.floor(i / 3)), 'yyyy-MM-dd');
    const invRef = `INV-2026-${String(8000 + i).padStart(5, '0')}`;
    const matched = i < 25;

    txns.push({
      id: `bt-${i}`, bankTxnId: `BNK${String(900000 + i)}`,
      valueDate: date, amount: amt, currency: cur,
      counterpartyText: cp + (i % 7 === 0 ? ' Ltd' : ''), // slight alias drift
      remittanceText: i % 4 === 0 ? invRef : `Payment ref ${cp.split(' ')[0]}`,
      bankRef: `REF-${String(i).padStart(6, '0')}`,
      bankAccount: BANKS[i % BANKS.length],
      direction: i % 5 === 0 ? 'debit' : 'credit',
      statementFormat: i % 3 === 0 ? 'MT940' : i % 3 === 1 ? 'BAI2' : 'CSV',
      isMatched: matched,
    });

    if (matched || i < 35) {
      const bankFee = Math.round(Math.random() * 50 * 100) / 100;
      const invAmt = i % 6 === 0 ? amt + bankFee + Math.round(Math.random() * 200) : amt + bankFee;
      const diff = Math.round((amt - invAmt) * 100) / 100;
      const isExact = i % 4 === 0;
      let excType: string | null = null;
      if (!matched && i >= 25 && i < 30) excType = 'unapplied_cash';
      else if (Math.abs(diff) > 100 && diff < 0) excType = 'short_pay';
      else if (i % 12 === 0) excType = 'duplicate_pay';
      else if (i % 9 === 0 && cur !== 'USD') excType = 'fx_mismatch';

      matches.push({
        id: `pm-${i}`, bankTxnId: `bt-${i}`, bankTxnRef: `BNK${String(900000 + i)}`,
        invoiceRef: invRef,
        matchType: isExact ? 'exact' : (i % 3 === 0 ? 'partial' : 'fuzzy'),
        matchScore: isExact ? 1.0 : 0.75 + Math.random() * 0.2,
        matchedAmount: amt, remainingAmount: Math.max(0, Math.round(diff * -1)),
        currency: cur, bankAmount: amt, invoiceAmount: invAmt,
        counterparty: cp,
        differences: Math.abs(diff) > 1 ? [{ field: 'amount', bankValue: amt.toFixed(2), erpValue: invAmt.toFixed(2) }] : [],
        status: matched ? 'accepted' : (i < 30 ? 'proposed' : 'proposed'),
        exceptionType: excType, ownerRole: excType === 'fx_mismatch' ? 'Treasury' : 'BO',
        valueDate: date,
      });
    }
  }
  return { txns, matches };
}

export function useCashSettlement() {
  const [data] = useState(generateData);
  const [statusFilter, setStatusFilter] = useState('all');
  const [exceptionFilter, setExceptionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = useMemo(() => data.matches.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (exceptionFilter !== 'all') {
      if (exceptionFilter === 'exceptions' && !m.exceptionType) return false;
      if (exceptionFilter !== 'exceptions' && m.exceptionType !== exceptionFilter) return false;
    }
    if (searchQuery && !m.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase()) && !m.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) && !m.bankTxnRef.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [data.matches, statusFilter, exceptionFilter, searchQuery]);

  const unmatchedTxns = useMemo(() => data.txns.filter(t => !t.isMatched), [data.txns]);

  const stats = useMemo(() => {
    const total = data.txns.length;
    const matched = data.txns.filter(t => t.isMatched).length;
    const totalBankAmt = data.txns.reduce((s, t) => s + t.amount, 0);
    const matchedAmt = data.txns.filter(t => t.isMatched).reduce((s, t) => s + t.amount, 0);
    const exceptions = data.matches.filter(m => m.exceptionType);
    return {
      totalTxns: total,
      matchedPct: Math.round(matched / total * 100),
      unmatchedCount: total - matched,
      unmatchedAmount: Math.round(totalBankAmt - matchedAmt),
      exceptionCount: exceptions.length,
      shortPays: exceptions.filter(e => e.exceptionType === 'short_pay').length,
      unappliedCash: exceptions.filter(e => e.exceptionType === 'unapplied_cash').length,
      proposedCount: data.matches.filter(m => m.status === 'proposed').length,
    };
  }, [data]);

  return {
    txns: data.txns, matches: data.matches, filteredMatches, unmatchedTxns, stats,
    statusFilter, setStatusFilter, exceptionFilter, setExceptionFilter,
    searchQuery, setSearchQuery,
  };
}

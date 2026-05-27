// Matching Engine - Normalization, Candidate Generation, Scoring

export interface RecordData {
  id: string;
  external_id: string | null;
  record_date: string | null;
  amount: number | null;
  currency: string | null;
  counterparty: string | null;
  description: string | null;
  normalized_text?: string;
}

export interface MatchCandidate {
  leftRecordId: string;
  rightRecordId: string;
  scoreTotal: number;
  scoreBreakdown: ScoreBreakdown;
  reasonCodes: string[];
  amountDelta: number;
  dateDelta: number;
}

export interface ScoreBreakdown {
  amount_score: number;
  date_score: number;
  text_score: number;
  id_score: number;
}

// Configuration
const CONFIG = {
  DATE_WINDOW_DAYS: 7,
  AMOUNT_TOLERANCE_PCT: 0.03, // 3%
  MAX_CANDIDATES_PER_RECORD: 30,
  WEIGHTS: {
    amount: 0.35,
    date: 0.25,
    text: 0.25,
    id: 0.15,
  },
  AUTO_MATCH_THRESHOLD: 0.97,
  REVIEW_THRESHOLD: 0.90,
  AMOUNT_AUTO_MATCH_PCT: 0.005, // 0.5%
  DATE_AUTO_MATCH_DAYS: 2,
  HIGH_AMOUNT_THRESHOLD: 100000,
};

// Normalization utilities
export function normalizeText(text: string | null): string {
  if (!text) return '';
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function parseAmount(amount: number | string | null): number {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === 'number') return amount;
  return parseFloat(amount.replace(/[^0-9.-]/g, '')) || 0;
}

// Text similarity using Jaccard index on tokens
export function textSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(normalizeText(text1).split(' ').filter(t => t.length > 2));
  const tokens2 = new Set(normalizeText(text2).split(' ').filter(t => t.length > 2));
  
  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}

// Calculate individual scores
export function calculateAmountScore(amount1: number, amount2: number): number {
  if (amount1 === 0 && amount2 === 0) return 1;
  if (amount1 === 0 || amount2 === 0) return 0;
  
  const delta = Math.abs(amount1 - amount2);
  const maxAmount = Math.max(Math.abs(amount1), Math.abs(amount2));
  const pctDelta = delta / maxAmount;
  
  if (pctDelta <= CONFIG.AMOUNT_TOLERANCE_PCT) {
    return 1 - (pctDelta / CONFIG.AMOUNT_TOLERANCE_PCT) * 0.3; // Score 0.7-1.0 within tolerance
  }
  return Math.max(0, 0.7 - (pctDelta - CONFIG.AMOUNT_TOLERANCE_PCT) * 2);
}

export function calculateDateScore(date1: Date | null, date2: Date | null): number {
  if (!date1 || !date2) return 0.5; // Neutral if missing
  
  const diffDays = Math.abs(Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (diffDays === 0) return 1;
  if (diffDays <= CONFIG.DATE_WINDOW_DAYS) {
    return 1 - (diffDays / CONFIG.DATE_WINDOW_DAYS) * 0.5; // Decay to 0.5
  }
  return Math.max(0, 0.5 - (diffDays - CONFIG.DATE_WINDOW_DAYS) * 0.05);
}

export function calculateIdScore(id1: string | null, id2: string | null): number {
  if (!id1 || !id2) return 0;
  const norm1 = normalizeText(id1);
  const norm2 = normalizeText(id2);
  if (norm1 === norm2) return 1;
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  return 0;
}

// Generate candidates for a single record
export function generateCandidates(
  recordA: RecordData,
  recordsB: RecordData[]
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const dateA = parseDate(recordA.record_date);
  const amountA = parseAmount(recordA.amount);
  
  for (const recordB of recordsB) {
    const dateB = parseDate(recordB.record_date);
    const amountB = parseAmount(recordB.amount);
    
    // Pre-filtering: currency must match
    if (recordA.currency && recordB.currency && recordA.currency !== recordB.currency) {
      continue;
    }
    
    // Pre-filtering: date window
    if (dateA && dateB) {
      const diffDays = Math.abs(Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24)));
      if (diffDays > CONFIG.DATE_WINDOW_DAYS) continue;
    }
    
    // Pre-filtering: amount range
    if (amountA > 0 && amountB > 0) {
      const pctDiff = Math.abs(amountA - amountB) / Math.max(amountA, amountB);
      if (pctDiff > CONFIG.AMOUNT_TOLERANCE_PCT * 2) continue; // Allow 2x tolerance for candidates
    }
    
    // Calculate scores
    const amountScore = calculateAmountScore(amountA, amountB);
    const dateScore = calculateDateScore(dateA, dateB);
    const textScore = textSimilarity(recordA.description || '', recordB.description || '');
    const idScore = calculateIdScore(recordA.external_id, recordB.external_id);
    
    const scoreTotal = 
      CONFIG.WEIGHTS.amount * amountScore +
      CONFIG.WEIGHTS.date * dateScore +
      CONFIG.WEIGHTS.text * textScore +
      CONFIG.WEIGHTS.id * idScore;
    
    const amountDelta = amountB - amountA;
    const dateDelta = dateA && dateB 
      ? Math.floor((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Generate reason codes
    const reasonCodes: string[] = [];
    if (idScore === 1) reasonCodes.push('EXACT_ID_MATCH');
    if (amountScore >= 0.95) reasonCodes.push('AMOUNT_MATCH');
    else if (amountScore >= 0.7) reasonCodes.push('AMOUNT_WITHIN_TOLERANCE');
    else reasonCodes.push('AMOUNT_MISMATCH');
    if (dateScore === 1) reasonCodes.push('DATE_MATCH');
    else if (dateScore >= 0.7) reasonCodes.push('DATE_WITHIN_TOLERANCE');
    else if (dateA && dateB) reasonCodes.push('DATE_MISMATCH');
    if (textScore >= 0.8) reasonCodes.push('HIGH_TEXT_SIMILARITY');
    
    candidates.push({
      leftRecordId: recordA.id,
      rightRecordId: recordB.id,
      scoreTotal: Math.round(scoreTotal * 10000) / 10000,
      scoreBreakdown: {
        amount_score: Math.round(amountScore * 100) / 100,
        date_score: Math.round(dateScore * 100) / 100,
        text_score: Math.round(textScore * 100) / 100,
        id_score: Math.round(idScore * 100) / 100,
      },
      reasonCodes,
      amountDelta: Math.round(amountDelta * 100) / 100,
      dateDelta,
    });
  }
  
  // Sort by score and limit
  return candidates
    .sort((a, b) => b.scoreTotal - a.scoreTotal)
    .slice(0, CONFIG.MAX_CANDIDATES_PER_RECORD);
}

// Determine if a candidate qualifies for auto-match
export function isAutoMatchEligible(
  candidate: MatchCandidate,
  amountA: number
): { eligible: boolean; reason?: string } {
  if (candidate.scoreTotal < CONFIG.AUTO_MATCH_THRESHOLD) {
    return { eligible: false, reason: `Score ${candidate.scoreTotal} below threshold ${CONFIG.AUTO_MATCH_THRESHOLD}` };
  }
  
  const amountPctDelta = Math.abs(candidate.amountDelta) / Math.max(Math.abs(amountA), 1);
  if (amountPctDelta > CONFIG.AMOUNT_AUTO_MATCH_PCT) {
    return { eligible: false, reason: `Amount delta ${(amountPctDelta * 100).toFixed(2)}% exceeds ${CONFIG.AMOUNT_AUTO_MATCH_PCT * 100}%` };
  }
  
  if (Math.abs(candidate.dateDelta) > CONFIG.DATE_AUTO_MATCH_DAYS) {
    return { eligible: false, reason: `Date delta ${candidate.dateDelta} days exceeds ${CONFIG.DATE_AUTO_MATCH_DAYS} days` };
  }
  
  if (Math.abs(amountA) >= CONFIG.HIGH_AMOUNT_THRESHOLD) {
    return { eligible: false, reason: `High value transaction ($${amountA.toLocaleString()}) requires approval` };
  }
  
  return { eligible: true };
}

// Determine exception type for a record
export function determineExceptionType(
  candidates: MatchCandidate[],
  recordA: RecordData
): { type: 'unmatched' | 'amount_mismatch' | 'date_mismatch' | 'needs_review' | 'duplicate' | 'one_to_many'; severity: 'low' | 'medium' | 'high' } {
  if (candidates.length === 0) {
    return { 
      type: 'unmatched', 
      severity: Math.abs(parseAmount(recordA.amount)) >= 50000 ? 'high' : 'medium' 
    };
  }
  
  const topCandidate = candidates[0];
  
  // Check for duplicates (multiple high-scoring matches)
  const highScoreMatches = candidates.filter(c => c.scoreTotal >= CONFIG.REVIEW_THRESHOLD);
  if (highScoreMatches.length > 1) {
    return { type: 'duplicate', severity: 'high' };
  }
  
  // Check for 1-to-many
  if (candidates.length > 5 && candidates.filter(c => c.scoreTotal >= 0.8).length > 1) {
    return { type: 'one_to_many', severity: 'medium' };
  }
  
  // Check specific mismatch types
  if (topCandidate.scoreBreakdown.amount_score < 0.7 && topCandidate.scoreBreakdown.date_score >= 0.7) {
    return { 
      type: 'amount_mismatch', 
      severity: Math.abs(topCandidate.amountDelta) >= 10000 ? 'high' : 'medium' 
    };
  }
  
  if (topCandidate.scoreBreakdown.date_score < 0.7 && topCandidate.scoreBreakdown.amount_score >= 0.7) {
    return { 
      type: 'date_mismatch', 
      severity: Math.abs(topCandidate.dateDelta) > 30 ? 'high' : 'low' 
    };
  }
  
  return { type: 'needs_review', severity: 'medium' };
}

export { CONFIG as MATCHING_CONFIG };

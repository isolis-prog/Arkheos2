import { useState } from 'react';
import { Lightbulb, Link2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MatchRecord } from '@/hooks/useMatchReviewData';

interface SuggestedMatch {
  id: string;
  etrmRecord: MatchRecord;
  netsuiteRecord: MatchRecord;
  score: number;
  matchReasons: string[];
}

interface SuggestedMatchesTableProps {
  unmatchedEtrm: { id: string; matchKey: string; amount: number }[];
  unmatchedNetsuite: { id: string; matchKey: string; amount: number }[];
  etrmRecords: MatchRecord[];
  netsuiteRecords: MatchRecord[];
  isLoading: boolean;
}

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

// Generate suggested matches based on similarity
function generateSuggestedMatches(
  unmatchedEtrm: { id: string; matchKey: string; amount: number }[],
  unmatchedNetsuite: { id: string; matchKey: string; amount: number }[],
  etrmRecords: MatchRecord[],
  netsuiteRecords: MatchRecord[]
): SuggestedMatch[] {
  const suggestions: SuggestedMatch[] = [];
  
  // Create lookup maps
  const etrmMap = new Map<string, MatchRecord>();
  const netsuiteMap = new Map<string, MatchRecord>();
  
  etrmRecords.forEach(r => {
    const key = `${r.dealId}|${r.feeType}|${r.strategy}`;
    etrmMap.set(key, r);
  });
  
  netsuiteRecords.forEach(r => {
    const key = `${r.dealId}|${r.feeType}|${r.strategy}`;
    netsuiteMap.set(key, r);
  });

  // For orphan NetSuite records, try to find similar ETRM records
  unmatchedNetsuite.slice(0, 10).forEach((nsOrphan, idx) => {
    // Parse the match key to extract components
    const [dealId, feeType, strategy] = nsOrphan.matchKey.split('|');
    
    // Try to find a similar ETRM record
    const nsRecord = netsuiteRecords.find(r => 
      r.dealId === dealId && r.feeType === feeType && r.strategy === strategy
    );

    if (nsRecord) {
      // Look for potential matches in ETRM with similar attributes
      const potentialMatches = etrmRecords.filter(etrm => 
        etrm.counterparty === nsRecord.counterparty &&
        etrm.feeType === nsRecord.feeType &&
        Math.abs(etrm.amount - nsRecord.amount) < nsRecord.amount * 0.1 // Within 10%
      );

      if (potentialMatches.length > 0) {
        const bestMatch = potentialMatches[0];
        const amountDiff = Math.abs(bestMatch.amount - nsRecord.amount);
        const amountScore = Math.max(0, 100 - (amountDiff / nsRecord.amount) * 100);
        const counterpartyMatch = bestMatch.counterparty === nsRecord.counterparty;
        const feeTypeMatch = bestMatch.feeType === nsRecord.feeType;
        
        const score = Math.round(
          (amountScore * 0.5) + 
          (counterpartyMatch ? 30 : 0) + 
          (feeTypeMatch ? 20 : 0)
        );

        const reasons: string[] = [];
        if (counterpartyMatch) reasons.push('Same counterparty');
        if (feeTypeMatch) reasons.push('Same fee type');
        if (amountScore > 90) reasons.push('Amount within 10%');

        suggestions.push({
          id: `suggested-${idx}`,
          etrmRecord: bestMatch,
          netsuiteRecord: nsRecord,
          score,
          matchReasons: reasons,
        });
      }
    }
  });

  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score);
}

export function SuggestedMatchesTable({ 
  unmatchedEtrm,
  unmatchedNetsuite,
  etrmRecords, 
  netsuiteRecords, 
  isLoading 
}: SuggestedMatchesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [acceptedMatches, setAcceptedMatches] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const suggestedMatches = generateSuggestedMatches(
    unmatchedEtrm,
    unmatchedNetsuite,
    etrmRecords,
    netsuiteRecords
  );

  const handleAcceptMatch = (id: string) => {
    setAcceptedMatches(prev => new Set(prev).add(id));
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">Suggested Matches</CardTitle>
          <StatusBadge variant="warning">{suggestedMatches.length}</StatusBadge>
        </div>
        <CardDescription>
          AI-suggested potential matches based on similarity analysis. Review and accept or reject.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestedMatches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No suggested matches found</p>
            <p className="text-sm mt-1">All orphan records have been analyzed</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>ETRM Record</TableHead>
                  <TableHead>NetSuite Record</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Reasons</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestedMatches.map((suggestion) => {
                  const isExpanded = expandedRow === suggestion.id;
                  const isAccepted = acceptedMatches.has(suggestion.id);

                  return (
                    <>
                      <TableRow 
                        key={suggestion.id}
                        className={`cursor-pointer hover:bg-muted/50 ${isAccepted ? 'bg-success/5' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : suggestion.id)}
                      >
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{suggestion.etrmRecord.dealId}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(suggestion.etrmRecord.amount)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{suggestion.netsuiteRecord.dealId}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(suggestion.netsuiteRecord.amount)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={suggestion.score} className="w-16 h-2" />
                            <span className="font-mono text-sm">{suggestion.score}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.matchReasons.map((reason, idx) => (
                              <StatusBadge key={idx} variant="muted" className="text-xs">
                                {reason}
                              </StatusBadge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAccepted ? (
                            <StatusBadge variant="success">
                              <Check className="h-3 w-3 mr-1" />
                              Accepted
                            </StatusBadge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptMatch(suggestion.id);
                              }}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {isExpanded && (
                          <TableRow key={`${suggestion.id}-detail`}>
                            <TableCell colSpan={6} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <SuggestionDetailPanel suggestion={suggestion} />
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionDetailPanel({ suggestion }: { suggestion: SuggestedMatch }) {
  return (
    <div className="bg-warning/5 p-6 border-t border-warning/20">
      <div className="grid grid-cols-2 gap-6">
        {/* ETRM Side */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            ETRM Record
          </h4>
          <RecordDetails record={suggestion.etrmRecord} />
        </div>

        {/* NetSuite Side */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-2" />
            NetSuite Record
          </h4>
          <RecordDetails record={suggestion.netsuiteRecord} />
        </div>
      </div>

      {/* Comparison */}
      <div className="mt-4 p-4 bg-background rounded-lg border">
        <h4 className="font-semibold text-sm mb-2">Comparison Analysis</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Amount Difference:</span>
            <span className="ml-2 font-mono font-medium">
              {formatCurrency(Math.abs(suggestion.etrmRecord.amount - suggestion.netsuiteRecord.amount))}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Counterparty:</span>
            <span className="ml-2 font-medium">
              {suggestion.etrmRecord.counterparty === suggestion.netsuiteRecord.counterparty ? (
                <StatusBadge variant="success">Match</StatusBadge>
              ) : (
                <StatusBadge variant="error">Mismatch</StatusBadge>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Fee Type:</span>
            <span className="ml-2 font-medium">
              {suggestion.etrmRecord.feeType === suggestion.netsuiteRecord.feeType ? (
                <StatusBadge variant="success">Match</StatusBadge>
              ) : (
                <StatusBadge variant="error">Mismatch</StatusBadge>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Legal Entity:</span>
            <span className="ml-2 font-medium">
              {suggestion.etrmRecord.legalEntity === suggestion.netsuiteRecord.legalEntity ? (
                <StatusBadge variant="success">Match</StatusBadge>
              ) : (
                <StatusBadge variant="error">Mismatch</StatusBadge>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordDetails({ record }: { record: MatchRecord }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div>
        <dt className="text-muted-foreground">Deal ID</dt>
        <dd className="font-mono font-medium">{record.dealId}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="font-mono font-medium">{formatCurrency(record.amount, record.currency)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Strategy</dt>
        <dd className="font-medium">{record.strategy}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Fee Type</dt>
        <dd className="font-medium">{record.feeType}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Counterparty</dt>
        <dd className="font-medium">{record.counterparty}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Legal Entity</dt>
        <dd className="font-medium">{record.legalEntity}</dd>
      </div>
    </dl>
  );
}

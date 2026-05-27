import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MatchGroup, MatchRecord } from '@/hooks/useMatchReviewData';

interface MatchedPairsTableProps {
  matches: MatchGroup[];
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

export function MatchedPairsTable({ 
  matches, 
  etrmRecords, 
  netsuiteRecords, 
  isLoading 
}: MatchedPairsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter matches by search term
  const filteredMatches = matches.filter(m => 
    m.matchKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create lookup maps for fast record matching
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <CardTitle className="text-lg">Matched Pairs</CardTitle>
            <StatusBadge variant="success">{matches.length}</StatusBadge>
          </div>
          <Input
            placeholder="Search by match key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead>Match Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">ETRM Amount</TableHead>
                <TableHead className="text-right">NetSuite Amount</TableHead>
                <TableHead className="text-right">Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No matched pairs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.slice(0, 50).map((match) => {
                  const isExpanded = expandedRow === match.id;
                  const etrmRecord = etrmMap.get(match.matchKey);
                  const netsuiteRecord = netsuiteMap.get(match.matchKey);

                  return (
                    <>
                      <TableRow 
                        key={match.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(isExpanded ? null : match.id)}
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
                        <TableCell className="font-mono text-sm">
                          {match.matchKey}
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant="muted">
                            {match.matchType.replace(/_/g, ' ')}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(match.sideATotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(match.sideBTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-success">
                          {formatCurrency(match.delta)}
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {isExpanded && (
                          <TableRow key={`${match.id}-detail`}>
                            <TableCell colSpan={6} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <MatchDetailPanel 
                                  etrmRecord={etrmRecord}
                                  netsuiteRecord={netsuiteRecord}
                                />
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filteredMatches.length > 50 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing 50 of {filteredMatches.length} matches
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MatchDetailPanelProps {
  etrmRecord?: MatchRecord;
  netsuiteRecord?: MatchRecord;
}

function MatchDetailPanel({ etrmRecord, netsuiteRecord }: MatchDetailPanelProps) {
  return (
    <div className="bg-muted/30 p-6 border-t">
      <div className="grid grid-cols-2 gap-6">
        {/* ETRM Side */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            ETRM Record
          </h4>
          {etrmRecord ? (
            <RecordDetails record={etrmRecord} />
          ) : (
            <p className="text-sm text-muted-foreground">Record details not available</p>
          )}
        </div>

        {/* NetSuite Side */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chart-2" />
            NetSuite Record
          </h4>
          {netsuiteRecord ? (
            <RecordDetails record={netsuiteRecord} />
          ) : (
            <p className="text-sm text-muted-foreground">Record details not available</p>
          )}
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
      {record.docId && (
        <div>
          <dt className="text-muted-foreground">Doc ID</dt>
          <dd className="font-mono font-medium">{record.docId}</dd>
        </div>
      )}
      {record.lineId && (
        <div>
          <dt className="text-muted-foreground">Line ID</dt>
          <dd className="font-mono font-medium">{record.lineId}</dd>
        </div>
      )}
    </dl>
  );
}

const formatCurrency2 = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

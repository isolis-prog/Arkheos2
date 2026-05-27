import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { 
  useReconciliationRun, 
  useMatchedPairs, 
  useBreaks, 
  useUnmatchedRecords,
  useCanonicalRecords 
} from '@/hooks/useMatchReviewData';
import { MatchSummaryHeader } from '@/components/match-review/MatchSummaryHeader';
import { MatchedPairsTable } from '@/components/match-review/MatchedPairsTable';
import { BreaksTable } from '@/components/match-review/BreaksTable';
import { SuggestedMatchesTable } from '@/components/match-review/SuggestedMatchesTable';

export default function ValuationReconMatchReview() {
  const { runId } = useParams<{ runId: string }>();
  
  const { data: run, isLoading: runLoading } = useReconciliationRun(runId || '');
  const { data: matchedPairs, isLoading: matchesLoading } = useMatchedPairs(runId || '');
  const { data: breaks, isLoading: breaksLoading } = useBreaks(runId || '');
  const { data: unmatched, isLoading: unmatchedLoading } = useUnmatchedRecords(runId || '');
  const { data: canonicalRecords, isLoading: recordsLoading } = useCanonicalRecords();

  const isLoading = runLoading || matchesLoading || breaksLoading || unmatchedLoading || recordsLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <MatchSummaryHeader run={run} isLoading={runLoading} />

      <Tabs defaultValue="matched" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="matched" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Matched
            {matchedPairs && (
              <span className="ml-1 text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                {matchedPairs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="breaks" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Breaks
            {breaks && (
              <span className="ml-1 text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                {breaks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggested" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Suggested
            {unmatched && (
              <span className="ml-1 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">
                {unmatched.netsuite.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matched">
          <MatchedPairsTable
            matches={matchedPairs || []}
            etrmRecords={canonicalRecords?.etrm || []}
            netsuiteRecords={canonicalRecords?.netsuite || []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="breaks">
          <BreaksTable
            breaks={breaks || []}
            etrmRecords={canonicalRecords?.etrm || []}
            netsuiteRecords={canonicalRecords?.netsuite || []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="suggested">
          <SuggestedMatchesTable
            unmatchedEtrm={unmatched?.etrm || []}
            unmatchedNetsuite={unmatched?.netsuite || []}
            etrmRecords={canonicalRecords?.etrm || []}
            netsuiteRecords={canonicalRecords?.netsuite || []}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

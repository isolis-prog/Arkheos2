import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchCandidate } from '@/hooks/useReconAgent';

interface MatchedPairsViewProps {
  runId: string;
  candidates: MatchCandidate[];
}

export function MatchedPairsView({ runId, candidates }: MatchedPairsViewProps) {
  // Filter to show high-score matches (auto-matched or approved)
  const matchedPairs = candidates.filter(c => c.score_total >= 0.97);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          Matched Pairs
          <Badge variant="secondary">{matchedPairs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matchedPairs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matched pairs yet. Run matching to generate matches.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {matchedPairs.map((match) => (
              <div 
                key={match.id} 
                className="rounded-lg border p-3 flex items-center gap-4"
              >
                {/* Left Record */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Source A</div>
                  <div className="font-mono text-sm truncate">
                    {match.left_record_id.slice(0, 12)}...
                  </div>
                </div>
                
                {/* Score */}
                <div className="flex flex-col items-center px-4">
                  <ArrowRight className="h-4 w-4 text-accent" />
                  <Badge variant="secondary" className="mt-1">
                    {(match.score_total * 100).toFixed(1)}%
                  </Badge>
                </div>
                
                {/* Right Record */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Source B</div>
                  <div className="font-mono text-sm truncate">
                    {match.right_record_id.slice(0, 12)}...
                  </div>
                </div>
                
                {/* Deltas */}
                <div className="text-right text-sm">
                  <div>
                    <span className="text-muted-foreground">Δ Amount: </span>
                    <span className={match.amount_delta === 0 ? 'text-accent' : 'text-warning'}>
                      ${Math.abs(match.amount_delta).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Δ Date: </span>
                    <span className={match.date_delta === 0 ? 'text-accent' : 'text-warning'}>
                      {match.date_delta} days
                    </span>
                  </div>
                </div>
                
                {/* Reason Codes */}
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                  {match.reason_codes?.slice(0, 2).map((code, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

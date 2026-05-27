import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { ExceptionWithDetails } from '@/hooks/useExceptionDetails';

interface BreakDetailsCardProps {
  exception: ExceptionWithDetails;
}

export function BreakDetailsCard({ exception }: BreakDetailsCardProps) {
  const formatCurrency = (amount: number | null, currency: string | null = 'USD') => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const matchGroup = exception.match_group;
  const template = exception.run?.template;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Break Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Comparison */}
        {matchGroup && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Amount Comparison</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {template?.side_a_source || 'Side A'}
                </p>
                <p className="text-xl font-mono font-semibold">
                  {formatCurrency(matchGroup.side_a_total, exception.currency)}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {template?.side_b_source || 'Side B'}
                </p>
                <p className="text-xl font-mono font-semibold">
                  {formatCurrency(matchGroup.side_b_total, exception.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Delta</p>
                <p className="text-2xl font-mono font-bold text-destructive">
                  {formatCurrency(matchGroup.delta, exception.currency)}
                </p>
              </div>
              {matchGroup.delta_pct !== null && (
                <div className="text-center pl-4 border-l">
                  <p className="text-xs text-muted-foreground mb-1">Variance</p>
                  <div className="flex items-center gap-1 justify-center">
                    {matchGroup.delta_pct > 0 ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <p className="text-lg font-semibold text-destructive">
                      {Math.abs(matchGroup.delta_pct).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Match Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Match Details</h4>
          <dl className="space-y-2 text-sm">
            {matchGroup?.match_key && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Match Key</dt>
                <dd className="font-mono">{matchGroup.match_key}</dd>
              </div>
            )}
            {matchGroup?.match_type && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Match Type</dt>
                <dd className="font-medium">{matchGroup.match_type.replace(/_/g, ' ')}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Break Type</dt>
              <dd className="font-medium">{exception.break_type.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium">{exception.currency || 'USD'}</dd>
            </div>
          </dl>
        </div>

        <Separator />

        {/* Metadata */}
        {exception.metadata && Object.keys(exception.metadata).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Information</h4>
            <dl className="space-y-2 text-sm">
              {Object.entries(exception.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="font-medium truncate max-w-[200px]">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Resolution Info */}
        {(exception.reason_code || exception.reason_details) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Resolution</h4>
              {exception.reason_code && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Reason Code</dt>
                  <dd className="font-medium">{exception.reason_code}</dd>
                </div>
              )}
              {exception.reason_details && (
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  {exception.reason_details}
                </p>
              )}
              {exception.resolved_user && exception.resolved_at && (
                <p className="text-xs text-muted-foreground">
                  Resolved by {exception.resolved_user.full_name || exception.resolved_user.email} on {new Date(exception.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TradePnL } from '@/hooks/usePnLAttribution';
import { cn } from '@/lib/utils';

interface TradePnLTableProps {
  trades: TradePnL[];
  isLoading: boolean;
}

export const TradePnLTable = ({ trades, isLoading }: TradePnLTableProps) => {
  const navigate = useNavigate();

  const fmt = (amount: number, showSign = false) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    if (showSign) return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    return formatted;
  };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (trades.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-lg font-medium text-muted-foreground">No trades with PnL movement</p></div>;
  }

  const sortedTrades = [...trades].sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL));

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trade ID</TableHead>
            <TableHead>Portfolio</TableHead>
            <TableHead>Book</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="text-right">Realized</TableHead>
            <TableHead className="text-right">Unrealized</TableHead>
            <TableHead className="text-right">Total PnL</TableHead>
            <TableHead>Top Driver</TableHead>
            <TableHead className="text-center">Exception</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTrades.slice(0, 25).map((trade) => {
            const isPositive = trade.totalPnL >= 0;
            const topDriver = [...trade.attributions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

            return (
              <TableRow
                key={trade.dealId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/trade-explorer/${encodeURIComponent(trade.dealId)}`)}
              >
                <TableCell className="font-mono font-medium text-sm">{trade.dealId}</TableCell>
                <TableCell className="text-sm">{trade.portfolio || '-'}</TableCell>
                <TableCell className="text-sm">{trade.bookPortfolio || '-'}</TableCell>
                <TableCell className="text-sm">{trade.counterparty || '-'}</TableCell>
                <TableCell className="text-right text-sm">
                  <span className={cn(trade.realized >= 0 ? 'text-success' : 'text-destructive')}>
                    {fmt(trade.realized, true)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{fmt(trade.unrealized, true)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn('inline-flex items-center gap-1 font-semibold', isPositive ? 'text-success' : 'text-destructive')}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {fmt(trade.totalPnL, true)}
                  </span>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{topDriver?.label}</Badge></TableCell>
                <TableCell className="text-center">
                  {trade.linkedExceptionId ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-warning mx-auto cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>Linked to exception — high unexplained PnL</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

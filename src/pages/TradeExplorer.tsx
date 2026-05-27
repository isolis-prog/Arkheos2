import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Database, Users, Layers, Banknote, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeSearchFilters } from '@/components/trade-explorer/TradeSearchFilters';
import { TradesTable } from '@/components/trade-explorer/TradesTable';
import { AINaturalLanguageQuery } from '@/components/ail/AINaturalLanguageQuery';
import { CashflowContextTab } from '@/components/trade/CashflowContextTab';
import { useTradeExplorer } from '@/hooks/useTradeExplorer';

const TradeExplorer = () => {
  const { trades, isLoading, filters, setFilters, filterOptions, totalTrades } = useTradeExplorer();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Auto-select first trade when list changes; clear if it disappears from filtered list
  useEffect(() => {
    if (trades.length === 0) {
      setSelectedDealId(null);
      return;
    }
    if (!selectedDealId || !trades.some((t) => t.dealId === selectedDealId)) {
      setSelectedDealId(trades[0].dealId);
    }
  }, [trades, selectedDealId]);
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   const totalAmount = trades.reduce((sum, t) => sum + t.totalAmount, 0);
   const totalEvents = trades.reduce((sum, t) => sum + t.eventCount, 0);
   const uniqueCounterparties = new Set(trades.map((t) => t.counterparty).filter(Boolean)).size;
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Trade & Event Explorer"
         description="Unified view of trades and economic events from ETRM and ERP systems"
       />
 
       {/* Stats cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <MetricCard
           title="Total Trades"
           value={trades.length.toLocaleString()}
           icon={TrendingUp}
           subtitle={`of ${totalTrades} total`}
           isLoading={isLoading}
         />
         <MetricCard
           title="Economic Events"
           value={totalEvents.toLocaleString()}
           icon={Layers}
           subtitle="across all trades"
           isLoading={isLoading}
         />
         <MetricCard
           title="Counterparties"
           value={uniqueCounterparties.toLocaleString()}
           icon={Users}
           subtitle="unique entities"
           isLoading={isLoading}
         />
         <MetricCard
           title="Total Value"
           value={formatCurrency(totalAmount)}
           icon={Database}
           subtitle="aggregated amount"
           isLoading={isLoading}
         />
       </div>
 
       {/* Filters and table */}
       <Card>
         <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2 text-lg">
             <TrendingUp className="h-5 w-5" />
             Trades
           </CardTitle>
         </CardHeader>
           <CardContent className="space-y-4">
             <TradeSearchFilters
               filters={filters}
               onFiltersChange={setFilters}
               filterOptions={filterOptions}
             />
             <AINaturalLanguageQuery query={filters.dealId || ''} />
             <TradesTable
               trades={trades}
               isLoading={isLoading}
               selectedDealId={selectedDealId}
               onSelect={setSelectedDealId}
             />
          </CardContent>
        </Card>

        {/* Cashflow Context for selected trade */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Banknote className="h-5 w-5" />
                Cashflow Context
                {selectedDealId && (
                  <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                    · {selectedDealId}
                  </span>
                )}
              </CardTitle>
              {selectedDealId && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/trade-explorer/${encodeURIComponent(selectedDealId)}`}>
                    Abrir Trade Detail
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedDealId ? (
              <CashflowContextTab dealId={selectedDealId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a trade above to see its cashflow history and drill links.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  export default TradeExplorer;
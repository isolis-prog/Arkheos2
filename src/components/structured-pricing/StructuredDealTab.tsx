import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import type { PricingQuote } from '@/hooks/useStructuredPricing';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  quotes: PricingQuote[];
}

export function StructuredDealTab({ quotes }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-lg font-semibold">Structured Deal Quotes</h3>

      <div className="grid gap-4">
        {quotes.map(q => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{q.deal_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={q.status === 'QUOTED' ? 'default' : 'secondary'}>{q.status}</Badge>
                  <span className="font-mono font-bold">{fmt(q.total_premium)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Legs */}
              <div className="space-y-1">
                {q.legs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-3 rounded border p-2 text-sm">
                    <Badge variant="outline" className={leg.direction === 'Buy' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive'}>
                      {leg.direction}
                    </Badge>
                    <span>{leg.instrument}</span>
                    <span className="font-mono text-muted-foreground">K={leg.strike}</span>
                    <span className="font-mono text-muted-foreground">{leg.tenor_months}M</span>
                    <span className="ml-auto font-mono">{leg.notional.toLocaleString()} units</span>
                  </div>
                ))}
              </div>

              {/* Aggregate Greeks */}
              <div className="grid grid-cols-4 gap-3 pt-2 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Delta</p>
                  <p className="font-mono font-bold">{q.aggregate_greeks.delta.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Gamma</p>
                  <p className="font-mono font-bold">{q.aggregate_greeks.gamma.toFixed(3)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Vega</p>
                  <p className="font-mono font-bold">{q.aggregate_greeks.vega.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Theta</p>
                  <p className="font-mono font-bold">{q.aggregate_greeks.theta.toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import type { PricingRun } from '@/hooks/useStructuredPricing';

interface Props {
  form: { instrument: string; commodity: string; strike: number; expiry: string; spot: number; vol: number; rate: number };
  setForm: (f: any) => void;
  result: PricingRun | null;
  onRun: () => void;
  history: PricingRun[];
}

export function OptionPricerTab({ form, setForm, result, onRun, history }: Props) {
  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input form */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Black-76 Option Pricer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Instrument</Label>
              <Select value={form.instrument} onValueChange={v => update('instrument', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="european_call">European Call</SelectItem>
                  <SelectItem value="european_put">European Put</SelectItem>
                  <SelectItem value="asian_call">Asian Call</SelectItem>
                  <SelectItem value="asian_put">Asian Put</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Commodity</Label>
              <Select value={form.commodity} onValueChange={v => update('commodity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WTI Crude">WTI Crude</SelectItem>
                  <SelectItem value="Brent Crude">Brent Crude</SelectItem>
                  <SelectItem value="Henry Hub">Henry Hub</SelectItem>
                  <SelectItem value="Gasoil">Gasoil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Strike</Label>
                <Input type="number" value={form.strike} onChange={e => update('strike', +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Spot Price</Label>
                <Input type="number" value={form.spot} onChange={e => update('spot', +e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Expiry Date</Label>
              <Input type="date" value={form.expiry} onChange={e => update('expiry', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Vol (%)</Label>
                <Input type="number" value={form.vol} onChange={e => update('vol', +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Rate (%)</Label>
                <Input type="number" value={form.rate} onChange={e => update('rate', +e.target.value)} />
              </div>
            </div>
            <Button onClick={onRun} className="w-full gap-2"><Calculator className="h-4 w-4" />Price Option</Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Pricing Result</CardTitle></CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{result.instrument_type}</Badge>
                  <span className="text-sm text-muted-foreground">{result.commodity} | K={result.strike} | Exp={result.expiry_date}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ResultCard label="Premium" value={`$${result.premium.toFixed(4)}`} highlight />
                  <ResultCard label="Delta (Δ)" value={result.delta.toFixed(4)} />
                  <ResultCard label="Gamma (Γ)" value={result.gamma.toFixed(4)} />
                  <ResultCard label="Vega (ν)" value={`$${result.vega.toFixed(4)}`} />
                  <ResultCard label="Theta (Θ)" value={`$${result.theta.toFixed(4)}/d`} />
                  <ResultCard label="Spot" value={`$${result.spot_price}`} />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">Configure inputs and click "Price Option" to calculate</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-muted-foreground">Recent Pricing Runs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {history.map(r => (
                <div key={r.id} className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <Badge variant="outline" className="text-[10px]">{r.instrument_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.run_at).toLocaleString()}</span>
                  </div>
                  <p className="font-medium">{r.commodity} K={r.strike}</p>
                  <p className="font-mono">Premium: ${r.premium.toFixed(4)} | Δ={r.delta.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'bg-primary/5 border-primary/20' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

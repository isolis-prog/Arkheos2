import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { VolSurfaceEntry } from '@/hooks/useStructuredPricing';

interface Props {
  data: VolSurfaceEntry[];
  commodity: string;
  onCommodityChange: (v: string) => void;
}

export function VolSurfaceTab({ data, commodity, onCommodityChange }: Props) {
  // Build grid
  const tenors = [...new Set(data.map(d => d.tenor_days))].sort((a, b) => a - b);
  const strikes = [...new Set(data.map(d => d.strike_pct_atm))].sort((a, b) => a - b);

  const getVol = (tenor: number, strike: number) => {
    const entry = data.find(d => d.tenor_days === tenor && d.strike_pct_atm === strike);
    return entry?.implied_vol_pct ?? null;
  };

  const allVols = data.map(d => d.implied_vol_pct);
  const minVol = Math.min(...allVols);
  const maxVol = Math.max(...allVols);

  const volColor = (vol: number) => {
    const ratio = (vol - minVol) / (maxVol - minVol || 1);
    if (ratio < 0.25) return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
    if (ratio < 0.5) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300';
    if (ratio < 0.75) return 'bg-orange-500/20 text-orange-800 dark:text-orange-300';
    return 'bg-destructive/15 text-destructive';
  };

  const tenorLabel = (d: number) => d >= 365 ? `${(d / 365).toFixed(0)}Y` : d >= 30 ? `${Math.round(d / 30)}M` : `${d}D`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Volatility Surface</h3>
        <Select value={commodity} onValueChange={onCommodityChange}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="WTI Crude">WTI Crude</SelectItem>
            <SelectItem value="Brent Crude">Brent Crude</SelectItem>
            <SelectItem value="Henry Hub">Henry Hub</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{commodity} — Implied Vol (%) by Strike & Tenor</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-semibold text-muted-foreground border-b">Strike % ATM</th>
                {tenors.map(t => (
                  <th key={t} className="p-2 font-semibold text-muted-foreground border-b text-center">{tenorLabel(t)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strikes.map(s => (
                <tr key={s} className={s === 100 ? 'font-bold' : ''}>
                  <td className="p-2 border-b font-mono">{s}%{s === 100 ? ' (ATM)' : ''}</td>
                  {tenors.map(t => {
                    const vol = getVol(t, s);
                    return (
                      <td key={t} className={`p-2 border-b text-center font-mono ${vol !== null ? volColor(vol) : ''}`}>
                        {vol !== null ? vol.toFixed(1) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

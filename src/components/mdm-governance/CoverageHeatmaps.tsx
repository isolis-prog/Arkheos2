import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CoverageHeatmap } from '@/hooks/useMDMGovernance';

const getCellColor = (pct: number) => {
  if (pct >= 95) return 'bg-emerald-500/80';
  if (pct >= 85) return 'bg-emerald-400/60';
  if (pct >= 75) return 'bg-yellow-400/60';
  if (pct >= 60) return 'bg-orange-400/60';
  return 'bg-destructive/60';
};

interface Props { heatmaps: CoverageHeatmap[]; }

export const CoverageHeatmaps = ({ heatmaps }: Props) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {heatmaps.map(hm => (
      <Card key={hm.category}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{hm.title}</CardTitle>
            <span className={cn('text-sm font-semibold px-2 py-0.5 rounded', hm.overallPct >= 90 ? 'bg-emerald-500/20 text-emerald-700' : hm.overallPct >= 75 ? 'bg-yellow-500/20 text-yellow-700' : 'bg-destructive/20 text-destructive')}>
              {hm.overallPct}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 text-muted-foreground"></th>
                  {hm.cols.map(c => <th key={c} className="p-1 text-muted-foreground text-center truncate max-w-[80px]">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {hm.rows.map(r => (
                  <tr key={r}>
                    <td className="p-1 text-muted-foreground truncate max-w-[100px]">{r}</td>
                    {hm.cols.map(c => {
                      const cell = hm.cells.find(cl => cl.row === r && cl.col === c);
                      if (!cell) return <td key={c} className="p-1"><div className="h-8 bg-muted rounded" /></td>;
                      return (
                        <td key={c} className="p-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn('h-8 rounded flex items-center justify-center text-xs font-medium text-white cursor-default', getCellColor(cell.coveragePct))}>
                                {cell.coveragePct}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{r} × {c}</p>
                              <p>{cell.covered}/{cell.total} covered</p>
                              {cell.gaps.length > 0 && <p className="text-destructive">{cell.gaps[0]}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

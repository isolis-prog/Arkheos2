import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { DeskFlash } from '@/hooks/useDailyPnLFlash';

interface Props {
  data: DeskFlash[];
  expandedDesk: string | null;
  onToggleDesk: (deskId: string) => void;
  varianceThreshold: number;
}

const fmt = (v: number, showSign = true) => {
  const abs = Math.abs(v);
  const sign = v >= 0 ? '+' : '-';
  const prefix = showSign ? sign : (v < 0 ? '-' : '');
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(1)}K`;
  return `${prefix}$${abs.toFixed(0)}`;
};

const pnlColor = (v: number) => v >= 0 ? 'text-success' : 'text-destructive';

export function DailyFlashTable({ data, expandedDesk, onToggleDesk, varianceThreshold }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily P&L Flash by Desk
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            As of {data[0]?.asOfTimestamp ? new Date(data[0].asOfTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Desk</TableHead>
              <TableHead className="text-right">Opening P&L</TableHead>
              <TableHead className="text-right">Current P&L</TableHead>
              <TableHead className="text-right">Day Change</TableHead>
              <TableHead>Key Driver</TableHead>
              <TableHead className="text-right">MO P&L</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((desk) => {
              const isExpanded = expandedDesk === desk.deskId;
              const breachesThreshold = desk.moVariance !== null && Math.abs(desk.moVariance) > varianceThreshold;
              return (
                <Collapsible key={desk.deskId} open={isExpanded} onOpenChange={() => onToggleDesk(desk.deskId)} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="w-8 p-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium">{desk.deskName}</TableCell>
                        <TableCell className={`text-right ${pnlColor(desk.openingPnL)}`}>{fmt(desk.openingPnL)}</TableCell>
                        <TableCell className={`text-right font-semibold ${pnlColor(desk.currentPnL)}`}>{fmt(desk.currentPnL)}</TableCell>
                        <TableCell className={`text-right font-semibold ${pnlColor(desk.dayChange)}`}>{fmt(desk.dayChange)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{desk.keyDriver}</Badge>
                        </TableCell>
                        <TableCell className={`text-right ${desk.moPnL !== null ? pnlColor(desk.moPnL) : ''}`}>
                          {desk.moPnL !== null ? fmt(desk.moPnL) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {desk.moVariance !== null ? (
                            <span className={`flex items-center justify-end gap-1 ${breachesThreshold ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                              {breachesThreshold && <AlertTriangle className="h-3 w-3" />}
                              {fmt(desk.moVariance)}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Position-Level Contributions — {desk.deskName}</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Instrument</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead className="text-right">Yest. Price</TableHead>
                                  <TableHead className="text-right">Curr. Price</TableHead>
                                  <TableHead className="text-right">P&L Contribution</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {desk.positions.map((pos) => (
                                  <TableRow key={pos.positionId}>
                                    <TableCell className="text-sm">{pos.instrument}</TableCell>
                                    <TableCell className="text-right text-sm">{pos.quantity.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-sm">${pos.yesterdayPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-sm">${pos.currentPrice.toFixed(2)}</TableCell>
                                    <TableCell className={`text-right text-sm font-semibold ${pnlColor(pos.pnlContribution)}`}>
                                      {fmt(pos.pnlContribution)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

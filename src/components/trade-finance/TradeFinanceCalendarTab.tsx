import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';

const typeColors: Record<string, string> = {
  lc: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  sblc: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  facility: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  finance: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

interface Props {
  events: { date: string; label: string; type: string }[];
}

export function TradeFinanceCalendarTab({ events }: Props) {
  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= now);
  const past = events.filter(e => e.date < now);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h3 className="text-lg font-semibold">Trade Finance Calendar</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Upcoming Events ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e, i) => {
                const daysOut = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Badge className={typeColors[e.type] || ''} variant="outline">{e.type.toUpperCase()}</Badge>
                      <span className="text-sm">{e.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{e.date}</span>
                      <Badge variant={daysOut <= 7 ? 'destructive' : daysOut <= 30 ? 'secondary' : 'outline'}>
                        {daysOut}d
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Past Events ({past.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 opacity-60">
              {past.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Badge className={typeColors[e.type] || ''} variant="outline">{e.type.toUpperCase()}</Badge>
                    <span className="text-sm">{e.label}</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">{e.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

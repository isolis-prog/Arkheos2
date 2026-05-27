import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WaterfallSummary } from '@/hooks/useOpsActuals';

interface Props { waterfall: WaterfallSummary[]; }

export const WaterfallChart = ({ waterfall }: Props) => (
  <Card>
    <CardHeader><CardTitle>Ops vs Contract Waterfall by Location</CardTitle></CardHeader>
    <CardContent>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waterfall} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="location" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend />
            <Bar dataKey="planned" name="Planned" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="nominated" name="Nominated" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="scheduled" name="Scheduled" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

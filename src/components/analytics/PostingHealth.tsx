import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePostingHealth } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, XCircle, RotateCcw, FileText } from 'lucide-react';

export const PostingHealth = () => {
  const { data, isLoading } = usePostingHealth();

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return null;

  const summaryCards = [
    { label: 'Total Postings', value: data.totalPostings, icon: FileText, color: 'text-muted-foreground' },
    { label: 'Success Rate', value: `${data.successRate}%`, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Failed', value: data.failedCount, icon: XCircle, color: 'text-destructive' },
    { label: 'Reversed', value: data.reversedCount, icon: RotateCcw, color: 'text-amber-500' },
  ];

  const chartData = data.byDocType.map(d => ({
    type: d.type.replace(/_/g, ' '),
    Success: d.total - d.failed,
    Failed: d.failed,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <c.icon className={`h-8 w-8 ${c.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Postings by Document Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Success" stackId="a" fill="hsl(142, 76%, 36%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Failed" stackId="a" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Failures</CardTitle></CardHeader>
          <CardContent>
            {data.recentFailures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
                <p>No recent posting failures</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doc Type</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentFailures.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Badge variant="outline">{f.docType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{f.error}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

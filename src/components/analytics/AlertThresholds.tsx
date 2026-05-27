import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAlertThresholds } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Globe } from 'lucide-react';

export const AlertThresholds = () => {
  const { data: thresholds, isLoading } = useAlertThresholds();

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Alert Thresholds</CardTitle>
            <CardDescription>Configurable alerting rules for key metrics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead className="text-right">Warning</TableHead>
              <TableHead className="text-right">Critical</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Webhook</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(thresholds || []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.displayName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{t.category.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {t.operator === 'gt' ? '>' : t.operator === 'lt' ? '<' : t.operator}
                </TableCell>
                <TableCell className="text-right font-mono text-amber-600">
                  {t.warningValue?.toLocaleString() ?? '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-destructive">
                  {t.criticalValue?.toLocaleString() ?? '—'}
                </TableCell>
                <TableCell className="text-center">
                  {t.notifyEmail ? <Mail className="h-4 w-4 mx-auto text-primary" /> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {t.notifyWebhook ? <Globe className="h-4 w-4 mx-auto text-primary" /> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={t.isEnabled} disabled />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

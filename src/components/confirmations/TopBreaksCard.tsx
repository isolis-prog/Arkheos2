import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

interface Props { breaksByType: Record<string, number>; }

const exceptionLabels: Record<string, string> = {
  price_mismatch: 'Price/Index Mismatch',
  qty_mismatch: 'Quantity Mismatch',
  location_mismatch: 'Location Mismatch',
  fee_mismatch: 'Fee Mismatch',
  amendment_mismatch: 'Amendment Mismatch',
  missing_confirmation: 'Missing Confirmation',
  missing_trade: 'Missing Trade',
  date_mismatch: 'Date Mismatch',
};

export const TopBreaksCard = ({ breaksByType }: Props) => {
  const sorted = Object.entries(breaksByType).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Top Breaks by Type</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No breaks detected</p>
        ) : (
          <div className="space-y-2">
            {sorted.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">{exceptionLabels[type] || type}</span>
                <StatusBadge variant="error">{count}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

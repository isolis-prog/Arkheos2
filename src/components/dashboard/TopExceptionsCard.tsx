import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TopException {
  id: string;
  dealId: string;
  type: string;
  amount: number;
  age: number;
  severity: string;
}

interface TopExceptionsCardProps {
  exceptions: TopException[];
  loading?: boolean;
}

export function TopExceptionsCard({ exceptions, loading }: TopExceptionsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Top Exceptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error' as const;
      case 'high':
        return 'warning' as const;
      case 'medium':
        return 'info' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Top Exceptions
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/exceptions">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exceptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No open exceptions</p>
          ) : (
            exceptions.map((exc, index) => (
              <motion.div
                key={exc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-mono font-medium">{exc.dealId}</p>
                  <p className="text-sm text-muted-foreground">{exc.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono font-medium">${exc.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{exc.age} days old</p>
                  </div>
                  <StatusBadge variant={getSeverityVariant(exc.severity)}>
                    {exc.severity}
                  </StatusBadge>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

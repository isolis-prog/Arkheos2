import { ArrowLeft, Clock, User, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant, getBreakVariant } from '@/components/ui/status-badge';
import type { ExceptionWithDetails } from '@/hooks/useExceptionDetails';

interface ExceptionHeaderProps {
  exception: ExceptionWithDetails;
}

export function ExceptionHeader({ exception }: ExceptionHeaderProps) {
  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'muted';
    }
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining(exception.sla_due_date);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/exceptions" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Exceptions
        </Link>
        <span>/</span>
        <span className="text-foreground font-mono">{exception.id.slice(0, 8)}</span>
      </div>

      {/* Main header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Exception Details</h1>
            <StatusBadge variant={getStatusVariant(exception.status)}>
              {exception.status.replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={getBreakVariant(exception.break_type)}>
              {exception.break_type.replace(/_/g, ' ')}
            </StatusBadge>
            <StatusBadge variant={getSeverityVariant(exception.severity || 'medium') as any}>
              {exception.severity || 'medium'}
            </StatusBadge>
            {exception.run?.template?.name && (
              <StatusBadge variant="muted">
                {exception.run.template.name}
              </StatusBadge>
            )}
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-3xl font-bold text-destructive font-mono">
            {formatCurrency(exception.amount_at_risk, exception.currency)}
          </p>
          <p className="text-sm text-muted-foreground">Amount at Risk</p>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        {exception.assigned_user && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Assigned to:</span>
            <span className="font-medium">
              {exception.assigned_user.full_name || exception.assigned_user.email}
            </span>
          </div>
        )}
        
        {exception.sla_due_date && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>SLA Due:</span>
            <span className={daysRemaining !== null && daysRemaining <= 2 ? 'text-warning font-medium' : ''}>
              {new Date(exception.sla_due_date).toLocaleDateString()}
              {daysRemaining !== null && (
                <span className="ml-1">
                  ({daysRemaining > 0 ? `${daysRemaining}d left` : 'Overdue'})
                </span>
              )}
            </span>
          </div>
        )}

        {exception.run?.period_start && exception.run?.period_end && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Period:</span>
            <span>
              {new Date(exception.run.period_start).toLocaleDateString()} - {new Date(exception.run.period_end).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

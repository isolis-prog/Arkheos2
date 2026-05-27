import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'muted';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'status-badge-success',
  warning: 'status-badge-warning',
  error: 'status-badge-error',
  info: 'status-badge-info',
  default: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
};

export const StatusBadge = ({
  children,
  variant = 'default',
  className,
}: StatusBadgeProps) => {
  return (
    <span className={cn('status-badge', variantStyles[variant], className)}>
      {children}
    </span>
  );
};

// Helper function to get variant from status
export const getStatusVariant = (status: string): StatusVariant => {
  const statusMap: Record<string, StatusVariant> = {
    // Exception statuses
    open: 'error',
    in_progress: 'warning',
    pending_approval: 'info',
    resolved: 'success',
    closed: 'muted',
    
    // Amendment statuses
    proposed: 'info',
    approved: 'success',
    rejected: 'error',
    executed: 'success',
    exported: 'success',
    
    // Run statuses
    pending: 'muted',
    running: 'info',
    completed: 'success',
    failed: 'error',
    
    // Match statuses
    matched: 'success',
    break: 'error',
    needs_review: 'warning',
  };
  
  return statusMap[status.toLowerCase()] || 'default';
};

// Break type to variant
export const getBreakVariant = (breakType: string): StatusVariant => {
  const breakMap: Record<string, StatusVariant> = {
    MISSING_IN_ERP: 'error',
    MISSING_IN_ETRM: 'error',
    AMOUNT_MISMATCH: 'warning',
    CURRENCY_MISMATCH: 'warning',
    DATE_MISMATCH: 'info',
    DUPLICATE_IN_ERP: 'warning',
    DUPLICATE_IN_ETRM: 'warning',
    KEY_MISMATCH: 'info',
    COMPLEX_GROUP: 'error',
  };
  
  return breakMap[breakType] || 'default';
};

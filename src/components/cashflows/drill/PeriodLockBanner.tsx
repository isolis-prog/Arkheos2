import { Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface PeriodLockBannerProps {
  periodName: string | null;
  lockedAt: string | null;
}

/**
 * Compact banner shown across Cashflows L2–L6 drill pages whenever the
 * accounting period covering the active as-of date is locked. Indicates
 * that resolution and export actions have been disabled.
 */
export function PeriodLockBanner({ periodName, lockedAt }: PeriodLockBannerProps) {
  return (
    <Alert className="border-warning/40 bg-warning/5 text-foreground">
      <Lock className="h-4 w-4" />
      <AlertTitle className="text-sm font-semibold">
        Period {periodName ?? ''} is locked
      </AlertTitle>
      <AlertDescription className="text-xs">
        This accounting period was closed
        {lockedAt ? ` on ${new Date(lockedAt).toLocaleDateString()}` : ''}. Exports and
        exception resolution are disabled until the period is reopened by Close
        Management.
      </AlertDescription>
    </Alert>
  );
}

import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ReconciliationFilters } from '@/hooks/useReconciliationFilters';

interface RunReconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedFilters: ReconciliationFilters;
  hasActiveFilters: boolean;
  activeFilterChips: { key: string; label: string; value: string }[];
  onRun: () => Promise<void>;
  isRunning: boolean;
}

export function RunReconDialog({
  open,
  onOpenChange,
  appliedFilters,
  hasActiveFilters,
  activeFilterChips,
  onRun,
  isRunning,
}: RunReconDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Run Reconciliation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {hasActiveFilters ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Running recon for current filtered scope:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeFilterChips.map((chip) => (
                      <span
                        key={chip.key}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        <span className="text-muted-foreground">{chip.label}:</span>{' '}
                        {chip.value}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No filters applied. This will run reconciliation for{' '}
                  <span className="font-medium text-foreground">all records</span> in scope.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRunning}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

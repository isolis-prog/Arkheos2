import { ReactNode } from 'react';
import { usePackageAccess } from '@/hooks/usePackageAccess';
import { UpgradePrompt } from '@/components/packages/UpgradePrompt';

interface PackageGuardProps {
  moduleKey: string;
  children: ReactNode;
}

export function PackageGuard({ moduleKey, children }: PackageGuardProps) {
  const { hasAccess } = usePackageAccess();

  if (!hasAccess(moduleKey)) {
    return <UpgradePrompt />;
  }

  return <>{children}</>;
}

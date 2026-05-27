import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UnifiedBreakModule } from '@/hooks/inbox/useUnifiedBreaks';
import {
  moduleLabel as registryLabel,
  moduleShortLabel,
  moduleBadgeClassName,
} from '@/lib/drill/module-registry';

export function ModulePill({
  module,
  compact = false,
  className,
}: {
  module: UnifiedBreakModule;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', moduleBadgeClassName(module), className)}
    >
      {compact ? moduleShortLabel(module) : registryLabel(module)}
    </Badge>
  );
}

export function moduleLabel(module: UnifiedBreakModule) {
  return registryLabel(module);
}

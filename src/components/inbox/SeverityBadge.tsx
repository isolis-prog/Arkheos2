import { Badge } from '@/components/ui/badge';
import type { UnifiedBreakSeverity } from '@/hooks/inbox/useUnifiedBreaks';

const VARIANTS: Record<UnifiedBreakSeverity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  material: { label: 'Material', className: 'bg-warning/15 text-warning border-warning/30' },
  review: { label: 'Review', className: 'bg-muted text-muted-foreground border-border' },
};

export function SeverityBadge({ severity }: { severity: UnifiedBreakSeverity }) {
  const v = VARIANTS[severity];
  return (
    <Badge variant="outline" className={`font-medium ${v.className}`}>
      {v.label}
    </Badge>
  );
}

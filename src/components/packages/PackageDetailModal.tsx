import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PackageDefinition, MODULE_DISPLAY_NAMES } from '@/hooks/usePackageAccess';
import { CheckCircle2, Mail } from 'lucide-react';

interface PackageDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageDef: PackageDefinition;
  isActive: boolean;
}

export function PackageDetailModal({ open, onOpenChange, packageDef, isActive }: PackageDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: packageDef.color }} />
            <DialogTitle>{packageDef.name}</DialogTitle>
            {isActive && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>}
          </div>
          <DialogDescription>{packageDef.tagline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Included Modules ({packageDef.modules.length})</h4>
            <ul className="space-y-1.5">
              {packageDef.modules.map(mod => (
                <li key={mod} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{MODULE_DISPLAY_NAMES[mod] || mod}</span>
                    {packageDef.descriptions[mod] && (
                      <span className="text-muted-foreground"> — {packageDef.descriptions[mod]}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-semibold">Best For</h4>
            <p className="text-sm text-muted-foreground">{packageDef.bestFor}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-semibold">Key Capabilities</h4>
            <p className="text-sm text-muted-foreground">{packageDef.keyMetrics}</p>
          </div>

          {!isActive && (
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <a href="mailto:sales@arkheos.io">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Sales
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

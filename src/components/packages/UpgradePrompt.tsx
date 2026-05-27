import { Link, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePackageAccess, PACKAGE_DEFINITIONS, ROUTE_MODULE_MAP, MODULE_DISPLAY_NAMES } from '@/hooks/usePackageAccess';
import { PackageDetailModal } from './PackageDetailModal';
import { useState } from 'react';

export function UpgradePrompt() {
  const location = useLocation();
  const { getRouteModule, getModulePackageDefinition } = usePackageAccess();
  const [modalOpen, setModalOpen] = useState(false);

  const moduleKey = getRouteModule(location.pathname);
  const packageDef = moduleKey ? getModulePackageDefinition(moduleKey) : undefined;
  const moduleName = moduleKey ? MODULE_DISPLAY_NAMES[moduleKey] || moduleKey : 'This Module';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{moduleName}</h1>
          {packageDef && (
            <p className="text-muted-foreground">
              This module is part of the{' '}
              <Badge
                className="text-white"
                style={{ backgroundColor: packageDef.color }}
              >
                {packageDef.name}
              </Badge>{' '}
              package.
            </p>
          )}
        </div>

        {packageDef && (
          <ul className="text-left text-sm text-muted-foreground space-y-1.5 mx-auto max-w-xs">
            <li>• {packageDef.modules.length} integrated modules</li>
            <li>• {packageDef.tagline}</li>
            <li>• {packageDef.keyMetrics.split(',')[0]}</li>
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {packageDef && (
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Learn More
            </Button>
          )}
          <Button asChild>
            <a href="mailto:sales@arkheos.io">
              <Mail className="h-4 w-4 mr-2" />
              Contact Sales
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Or activate individual module →{' '}
          <a href="mailto:sales@arkheos.io" className="underline">Request pricing</a>
        </p>

        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>
      </div>

      {packageDef && (
        <PackageDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          packageDef={packageDef}
          isActive={false}
        />
      )}
    </div>
  );
}

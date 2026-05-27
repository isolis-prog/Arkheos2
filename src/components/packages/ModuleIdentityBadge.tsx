import { useLocation } from 'react-router-dom';
import { usePackageAccess, MODULE_DISPLAY_NAMES } from '@/hooks/usePackageAccess';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface ModuleIdentityBadgeProps {
  moduleName?: string;
  moduleKey?: string;
}

export function ModuleIdentityBadge({ moduleName, moduleKey }: ModuleIdentityBadgeProps) {
  const location = useLocation();
  const { getRouteModule, getModulePackageDefinition, packageForModule } = usePackageAccess();

  const resolvedKey = moduleKey || getRouteModule(location.pathname);
  const packageDef = resolvedKey ? getModulePackageDefinition(resolvedKey) : undefined;
  const pkg = resolvedKey ? packageForModule(resolvedKey) : 'CORE';
  const displayName = moduleName || (resolvedKey ? MODULE_DISPLAY_NAMES[resolvedKey] : undefined);

  const packageName = packageDef?.name || 'Core';
  const packageColor = packageDef?.color || '#14B8A6'; // teal for core

  return (
    <div className="flex items-center justify-between mb-1">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">ArkheOS</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span style={{ color: packageColor }} className="text-sm font-medium">
              {pkg === 'CORE' ? 'Core' : packageName}
            </span>
          </BreadcrumbItem>
          {displayName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <Badge
        className="text-xs text-white"
        style={{ backgroundColor: packageColor }}
      >
        {pkg === 'CORE' ? 'Core' : packageName}
      </Badge>
    </div>
  );
}

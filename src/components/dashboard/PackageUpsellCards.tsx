import { useState } from 'react';
import { usePackageAccess, PACKAGE_DEFINITIONS, PackageKey } from '@/hooks/usePackageAccess';
import { PackageDetailModal } from '@/components/packages/PackageDetailModal';
import { ArrowRight } from 'lucide-react';

const upsellCopy: Record<string, string> = {
  PHYSICAL_OPS: '10 modules to control your physical supply chain',
  RISK_TRADING: '13 modules to master your trading analytics',
  FINANCE_TREASURY: '10 modules to automate trade-to-balance-sheet',
  COMPLIANCE_GOV: '6 modules to ensure institutional-grade compliance',
  AIL: 'AI layer to reduce manual review by 60–80%',
};

export function PackageUpsellCards() {
  const { isPackageActive } = usePackageAccess();
  const [modalPackage, setModalPackage] = useState<PackageKey | null>(null);

  const inactivePackages = PACKAGE_DEFINITIONS.filter(
    p => p.key !== 'CORE' && !isPackageActive(p.key)
  );

  if (inactivePackages.length === 0) return null;

  const modalDef = modalPackage
    ? PACKAGE_DEFINITIONS.find(p => p.key === modalPackage)
    : undefined;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Expand Your Platform
      </h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {inactivePackages.map(pkg => (
          <button
            key={pkg.key}
            onClick={() => setModalPackage(pkg.key)}
            className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-3 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pkg.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{pkg.name}</p>
              <p className="text-xs text-muted-foreground truncate">{upsellCopy[pkg.key]}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>

      {modalDef && (
        <PackageDetailModal
          open={!!modalPackage}
          onOpenChange={(open) => !open && setModalPackage(null)}
          packageDef={modalDef}
          isActive={false}
        />
      )}
    </div>
  );
}

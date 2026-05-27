import { Link, useLocation } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePackageAccess, PACKAGE_DEFINITIONS, PackageKey } from '@/hooks/usePackageAccess';
import { PackageDetailModal } from '@/components/packages/PackageDetailModal';
import {
  LayoutDashboard,
  FileSearch,
  AlertTriangle,
  Banknote,
  Crosshair,
  ClipboardCheck,
  Scale,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Map,
  Cog,
  History,
  Settings,
  Code2,
  Container,
  Anchor,
  Calendar,
  Activity,
  Boxes,
  ShieldCheck,
  Zap,
  GitBranch,
  FileSearch2,
  TrendingUp,
  BarChart3,
  LineChart,
  Coins,
  Shield,
  ShieldAlert,
  Leaf,
  Eye,
  HeartPulse,
  FileCheck,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

// ZONE A — Core
const coreItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Inbox, label: 'Unified Inbox', path: '/inbox' },
  { icon: FileSearch, label: 'Reconciliations', path: '/reconciliations' },
  { icon: Banknote, label: 'Cashflows', path: '/cashflows' },
  { icon: Banknote, label: 'Cashflow Buckets', path: '/cashflows/buckets' },
  { icon: Crosshair, label: 'Position & Risk', path: '/position-risk' },
  { icon: ClipboardCheck, label: 'Close Management', path: '/close-management-hub' },
  { icon: Scale, label: 'Regulatory', path: '/reg-reporting' },
];

// ZONE B — Package groups
interface PackageGroup {
  packageKey: PackageKey;
  items: NavItem[];
}

const packageGroups: PackageGroup[] = [
  {
    packageKey: 'PHYSICAL_OPS',
    items: [
      { icon: GitBranch, label: 'Supply Chain Status', path: '/operations/supply-chain-status' },
      { icon: Container, label: 'Logistics', path: '/logistics' },
      { icon: Anchor, label: 'Shipping & Charter', path: '/shipping-chartering' },
      { icon: Calendar, label: 'Scheduling', path: '/scheduling' },
      { icon: Boxes, label: 'Inventory', path: '/inventory' },
      { icon: ShieldCheck, label: 'Quality & Assay', path: '/quality' },
      { icon: Activity, label: 'Measurements', path: '/measurements' },
      { icon: Zap, label: 'ISO Settlements', path: '/iso-settlements' },
      { icon: Coins, label: 'Logistics Costs', path: '/logistics-costs' },
      { icon: FileSearch2, label: 'Doc Intelligence', path: '/doc-intelligence' },
    ],
  },
  {
    packageKey: 'RISK_TRADING',
    items: [
      { icon: Crosshair, label: 'Middle Office', path: '/middle-office' },
      { icon: TrendingUp, label: 'Trade Explorer', path: '/trade-explorer' },
      { icon: Activity, label: 'Trade Lifecycle', path: '/trade-lifecycle' },
      { icon: LineChart, label: 'Structured Pricing', path: '/structured-pricing' },
      { icon: BarChart3, label: 'Market Analytics', path: '/market-analytics' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: LineChart, label: 'Valuation & Curves', path: '/valuation' },
      { icon: LineChart, label: 'Market Data', path: '/market-data' },
      { icon: FileCheck, label: 'Confirmations Recon', path: '/confirmations-recon' },
      { icon: FileSearch, label: 'Valuation Recon', path: '/valuation-recon' },
    ],
  },
  {
    packageKey: 'FINANCE_TREASURY',
    items: [
      { icon: Banknote, label: 'Trade Finance', path: '/trade-finance' },
      { icon: Coins, label: 'FX & Treasury', path: '/fx-analytics' },
      { icon: Shield, label: 'Hedge Accounting', path: '/hedge-accounting' },
      { icon: Coins, label: 'Collateral & Margin', path: '/collateral-margin' },
      { icon: ShieldAlert, label: 'Credit Risk Mgmt', path: '/credit-risk-management' },
      { icon: Calendar, label: 'Deal-to-GL Tower', path: '/close-management' },
      { icon: Boxes, label: 'Intercompany', path: '/intercompany' },
      { icon: Coins, label: 'Tax Controls', path: '/tax-controls' },
    ],
  },
  {
    packageKey: 'COMPLIANCE_GOV',
    items: [
      { icon: ClipboardCheck, label: 'Internal Audit', path: '/internal-audit' },
      { icon: Leaf, label: 'ESG & Sourcing', path: '/esg' },
      { icon: ShieldCheck, label: 'Data Quality', path: '/data-quality' },
      { icon: HeartPulse, label: 'Data Health', path: '/data-health' },
      { icon: Eye, label: 'Audit & Explainability', path: '/audit-explainability' },
      { icon: ShieldCheck, label: 'Trade Capture QA', path: '/trade-capture-qa' },
      { icon: Map, label: 'MDM Governance', path: '/mdm-governance' },
    ],
  },
];

// ZONE C — Platform
const platformItems: NavItem[] = [
  { icon: Map, label: 'Core Mappings', path: '/mappings' },
  { icon: Cog, label: 'Rules Engine', path: '/rules' },
  { icon: History, label: 'Audit Logs', path: '/audit-logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const developerItem: NavItem = { icon: Code2, label: 'Developer Hub', path: '/developer-hub' };

export const Sidebar = () => {
  const location = useLocation();
  const { isEnabled } = useFeatureFlags();
  const { isPackageActive, getPackageDefinition } = usePackageAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const [modalPackage, setModalPackage] = useState<PackageKey | null>(null);
  const profile = { full_name: 'Demo User', email: 'demo@arkheos.com' };

  const togglePackage = (key: string) => {
    setExpandedPackages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItem = (item: NavItem, locked = false) => {
    const active = isActive(item.path);
    const content = (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'nav-link group relative',
          active && 'nav-link-active',
          collapsed && 'justify-center px-2',
          locked && 'opacity-50'
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-sm">{item.label}</span>
            {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}{locked ? ' (Locked)' : ''}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  const modalDef = modalPackage ? getPackageDefinition(modalPackage) : undefined;

  return (
    <>
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            'flex items-center border-b border-sidebar-border px-4 py-4',
            collapsed ? 'justify-center' : 'gap-3'
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-sm font-bold text-sidebar-primary-foreground">A</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-base font-semibold text-sidebar-foreground">ArkheOS</h1>
                <p className="text-[10px] text-sidebar-foreground/60">Operations Platform</p>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 px-2 py-3">
            <nav className="space-y-0.5">
              {/* ZONE A — CORE */}
              {!collapsed && (
                <p className="px-3 pb-1 pt-1 text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                  Core
                </p>
              )}
              {coreItems.map(item => renderNavItem(item))}

              {/* ZONE B — PACKAGES */}
              {packageGroups.map(group => {
                const pkgDef = getPackageDefinition(group.packageKey);
                const active = isPackageActive(group.packageKey);
                const expanded = active
                  ? expandedPackages[group.packageKey] !== false
                  : expandedPackages[group.packageKey] === true;
                const hasActiveRoute = group.items.some(i => isActive(i.path));

                return (
                  <div key={group.packageKey} className="pt-3">
                    {!collapsed ? (
                      <button
                        onClick={() => {
                          if (!active) {
                            setModalPackage(group.packageKey);
                          } else {
                            togglePackage(group.packageKey);
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                      >
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: active ? '#14B8A6' : '#9CA3AF' }}
                        />
                        <span className="flex-1 text-left truncate">{pkgDef?.name || group.packageKey}</span>
                        {active ? (
                          expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="my-1 border-t border-sidebar-border" />
                    )}

                    {(collapsed || expanded || hasActiveRoute) && (
                      <div className="space-y-0.5">
                        {group.items.map(item => renderNavItem(item, !active))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ZONE C — PLATFORM */}
              <div className="pt-4">
                {!collapsed && (
                  <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">
                    Platform
                  </p>
                )}
                {collapsed && <div className="my-1 border-t border-sidebar-border" />}
                {platformItems.map(item => renderNavItem(item))}
                {isEnabled('module.developer_tools') && renderNavItem(developerItem)}
              </div>
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t border-sidebar-border p-2">
            {!collapsed && profile && (
              <div className="mb-2 px-2 py-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{profile.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'px-2'
              )}
              onClick={() => console.log('Sign out disabled')}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2 text-xs">Sign Out</span>}
            </Button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>
      </aside>

      {modalDef && (
        <PackageDetailModal
          open={!!modalPackage}
          onOpenChange={(open) => !open && setModalPackage(null)}
          packageDef={modalDef}
          isActive={isPackageActive(modalPackage!)}
        />
      )}
    </>
  );
};

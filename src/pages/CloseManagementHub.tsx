import { Link } from 'react-router-dom';
import { ClipboardCheck, Shield, ArrowRight, Calendar, Layers, Coins, Lock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleIdentityBadge } from '@/components/packages/ModuleIdentityBadge';
import { usePackageAccess } from '@/hooks/usePackageAccess';

export default function CloseManagementHub() {
  const { isPackageActive } = usePackageAccess();
  const financeActive = isPackageActive('FINANCE_TREASURY');

  // Demo data
  const totalTasks = 20;
  const completedTasks = 14;
  const readiness = Math.round((completedTasks / totalTasks) * 100);
  const blockedTasks = 2;
  const isLocked = false;
  const currentPeriod = 'April 2026';

  const gaugeColor = readiness >= 80 ? 'text-emerald-500' : readiness >= 50 ? 'text-amber-500' : 'text-red-500';
  const gaugeBg = readiness >= 80 ? 'stroke-emerald-500' : readiness >= 50 ? 'stroke-amber-500' : 'stroke-red-500';

  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (readiness / 100) * circumference;

  const financeModules = [
    { label: 'Deal-to-GL Tower', path: '/close-management', icon: Calendar },
    { label: 'Intercompany', path: '/intercompany', icon: Layers },
    { label: 'Tax Controls', path: '/tax-controls', icon: Coins },
  ];

  return (
    <div className="space-y-6">
      <ModuleIdentityBadge moduleKey="CLOSE_MANAGEMENT" moduleName="Close Management" />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Close Management</h1>
        <p className="text-muted-foreground mt-1">Month-end close orchestration and evidence</p>
      </div>

      {isLocked ? (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">✓ Period Closed</h2>
          <p className="text-muted-foreground">Period: {currentPeriod}</p>
          <Button>Download Evidence Pack</Button>
        </div>
      ) : (
        <>
          {/* Readiness Gauge */}
          <div className="flex justify-center">
            <div className="relative flex flex-col items-center">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" className="stroke-muted" strokeWidth="10" />
                <circle
                  cx="70" cy="70" r="60" fill="none"
                  className={gaugeBg}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${gaugeColor}`}>{readiness}%</span>
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{completedTasks} of {totalTasks} tasks complete</p>
              <p className="text-xs text-muted-foreground">Period: {currentPeriod}</p>
            </div>
          </div>

          {/* Module Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Close Readiness</CardTitle>
                    <CardDescription>Checklist & task status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-semibold text-foreground">{blockedTasks} blocked</p>
                    <p className="text-xs text-muted-foreground">Tasks waiting on open exceptions</p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/close-readiness">View Checklist <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Close Cockpit</CardTitle>
                    <CardDescription>Sign-off workflow & Evidence Pack</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-semibold text-foreground">Pending</p>
                    <p className="text-xs text-muted-foreground">Risk Manager sign-off awaited</p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/close-cockpit">Open Cockpit <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Finance Package modules */}
      <div className="grid gap-4 md:grid-cols-3">
        {financeModules.map(mod => (
          <Card key={mod.path} className={!financeActive ? 'opacity-50' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <mod.icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mod.label}</p>
              </div>
              {financeActive ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={mod.path}><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Finance Package</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePackageAccess, PACKAGE_DEFINITIONS } from '@/hooks/usePackageAccess';
import { ModuleIdentityBadge } from '@/components/packages/ModuleIdentityBadge';
import { Store, Mail, CheckCircle2 } from 'lucide-react';
import { MODULE_DISPLAY_NAMES } from '@/hooks/usePackageAccess';

export default function Settings() {
  const { profile } = useAuth();
  const { isPackageActive, activePackages } = usePackageAccess();

  return (
    <div className="space-y-8">
      <ModuleIdentityBadge moduleKey="DASHBOARD" moduleName="Settings" />
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tenant">Tenant</TabsTrigger>
          <TabsTrigger value="packages">Packages & Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={profile?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={profile?.email || ''} disabled />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="mt-6">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Settings</CardTitle>
                <CardDescription>Organization-wide configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amendment Approval Threshold</Label>
                  <Input type="number" defaultValue="10000" />
                  <p className="text-xs text-muted-foreground">Amendments above this USD value require manager approval</p>
                </div>
                <div className="space-y-2">
                  <Label>Default SLA (days)</Label>
                  <Input type="number" defaultValue="7" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>Module availability and upcoming features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Community Marketplace</p>
                    <p className="text-xs text-muted-foreground">Available in a future release.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="mt-6 space-y-6">
          {/* Active Packages */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Active Packages</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {PACKAGE_DEFINITIONS.map(pkg => {
                const active = isPackageActive(pkg.key);
                return (
                  <Card key={pkg.key} className={!active ? 'opacity-60' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: active ? '#14B8A6' : '#9CA3AF' }} />
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        <Badge variant={active ? 'default' : 'secondary'} className="text-xs ml-auto">
                          {active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{pkg.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">{pkg.modules.length} modules included</p>
                      {active ? (
                        <div className="flex flex-wrap gap-1">
                          {pkg.modules.slice(0, 6).map(mod => (
                            <Badge key={mod} variant="outline" className="text-[10px]">
                              {MODULE_DISPLAY_NAMES[mod] || mod}
                            </Badge>
                          ))}
                          {pkg.modules.length > 6 && (
                            <Badge variant="outline" className="text-[10px]">+{pkg.modules.length - 6} more</Badge>
                          )}
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <a href="mailto:sales@arkheos.io">
                            <Mail className="h-3 w-3 mr-1" />
                            Contact sales to activate
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Request Change */}
          <Card className="max-w-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Need to change your package configuration?</p>
                <p className="text-xs text-muted-foreground">Contact your account manager to adjust packages or add individual modules.</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:sales@arkheos.io">
                  <Mail className="h-3 w-3 mr-1" />
                  Request Change
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

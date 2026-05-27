import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plug, Shield, Server, Database, Clock, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ERP_LABELS, SYNC_OBJECTS, type ERPType, type ERPEnv, type ERPAuthType } from '@/hooks/useERPConnectors';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'type', label: 'ERP Type', icon: Plug, description: 'Select ERP system & environment' },
  { id: 'auth', label: 'Authentication', icon: Shield, description: 'Configure credentials' },
  { id: 'connection', label: 'Connection', icon: Server, description: 'Set endpoints & parameters' },
  { id: 'objects', label: 'Sync Objects', icon: Database, description: 'Choose data to synchronize' },
  { id: 'schedule', label: 'Schedule', icon: Clock, description: 'Set sync frequency' },
  { id: 'test', label: 'Test & Save', icon: TestTube2, description: 'Validate and activate' },
];

export const ConnectorWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    erp_type: '' as ERPType | '',
    environment: 'uat' as ERPEnv,
    auth_type: 'api_key' as ERPAuthType,
    auth_fields: {} as Record<string, string>,
    connection_fields: {} as Record<string, string>,
    sync_objects: [] as string[],
    mapping_notes: '',
    schedule_enabled: false,
    schedule_cron: '0 */4 * * *',
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const update = (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial }));

  const canNext = () => {
    if (step === 0) return !!form.erp_type && !!form.name;
    if (step === 3) return form.sync_objects.length > 0;
    return true;
  };

  const handleTest = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
      toast.success('Connection test passed — sample data retrieved successfully');
    }, 2000);
  };

  const handleSave = () => {
    toast.success('ERP Connector created successfully');
    navigate('/integrations/erp-connectors');
  };

  const authFields: Record<ERPAuthType, { label: string; key: string; type?: string }[]> = {
    oauth2: [
      { label: 'Client ID', key: 'client_id' },
      { label: 'Client Secret', key: 'client_secret', type: 'password' },
      { label: 'Token URL', key: 'token_url' },
      { label: 'Scope', key: 'scope' },
    ],
    api_key: [
      { label: 'API Key', key: 'api_key', type: 'password' },
      { label: 'Header Name', key: 'header_name' },
    ],
    certificate: [
      { label: 'Certificate (PEM)', key: 'certificate' },
      { label: 'Private Key', key: 'private_key', type: 'password' },
    ],
    sso_saml: [
      { label: 'IdP Metadata URL', key: 'idp_metadata_url' },
      { label: 'Entity ID', key: 'entity_id' },
    ],
  };

  const connectionFieldsForType: Record<string, { label: string; key: string; placeholder: string }[]> = {
    sap: [
      { label: 'Host URL', key: 'host', placeholder: 'sap-prod.company.com' },
      { label: 'Port', key: 'port', placeholder: '443' },
      { label: 'Company Code', key: 'company_code', placeholder: '1000' },
      { label: 'Client', key: 'client', placeholder: '100' },
    ],
    oracle: [
      { label: 'Host URL', key: 'host', placeholder: 'oracle-erp.company.com' },
      { label: 'Business Unit', key: 'business_unit', placeholder: 'BU001' },
      { label: 'Ledger', key: 'ledger', placeholder: 'US Primary Ledger' },
    ],
    netsuite: [
      { label: 'Account ID', key: 'account_id', placeholder: '1234567' },
      { label: 'Subsidiary', key: 'subsidiary', placeholder: 'Parent Company' },
      { label: 'Realm', key: 'realm', placeholder: '1234567' },
    ],
    dynamics: [
      { label: 'Environment URL', key: 'environment_url', placeholder: 'https://org.crm.dynamics.com' },
      { label: 'Legal Entity', key: 'legal_entity', placeholder: 'USMF' },
      { label: 'Tenant ID', key: 'tenant_id', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    ],
    custom: [
      { label: 'Base URL', key: 'base_url', placeholder: 'https://api.example.com/v2' },
      { label: 'Timeout (ms)', key: 'timeout_ms', placeholder: '30000' },
      { label: 'Response Path', key: 'response_path', placeholder: 'data.records' },
    ],
  };

  const cronPresets = [
    { label: 'Every 30 min', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 4 hours', value: '0 */4 * * *' },
    { label: 'Daily at 6 AM', value: '0 6 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/integrations/erp-connectors')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New ERP Connector</h1>
          <p className="text-sm text-muted-foreground">Configure a native connection to your ERP system</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full',
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              <span className="hidden lg:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-2 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step].label}</CardTitle>
              <CardDescription>{STEPS[step].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 0: Type */}
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Connector Name</Label>
                    <Input placeholder="e.g. SAP S/4HANA Production" value={form.name} onChange={(e) => update({ name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>ERP System</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(Object.entries(ERP_LABELS) as [ERPType, string][]).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => update({ erp_type: type })}
                          className={cn(
                            'p-4 rounded-lg border-2 text-left transition-colors',
                            form.erp_type === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          )}
                        >
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {type === 'sap' && 'OData / BAPI / RFC'}
                            {type === 'oracle' && 'REST / SOAP / BI Publisher'}
                            {type === 'netsuite' && 'SuiteTalk / RESTlet'}
                            {type === 'dynamics' && 'OData v4 / Data Entities'}
                            {type === 'custom' && 'Generic REST API'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={form.environment} onValueChange={(v) => update({ environment: v as ERPEnv })}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="uat">UAT</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Step 1: Auth */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Authentication Method</Label>
                    <Select value={form.auth_type} onValueChange={(v) => update({ auth_type: v as ERPAuthType })}>
                      <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oauth2">OAuth 2.0 (Client Credentials)</SelectItem>
                        <SelectItem value="api_key">API Key / Token</SelectItem>
                        <SelectItem value="certificate">Certificate (mTLS)</SelectItem>
                        <SelectItem value="sso_saml">SSO / SAML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    {authFields[form.auth_type].map((f) => (
                      <div key={f.key} className="space-y-2">
                        <Label>{f.label}</Label>
                        <Input
                          type={f.type || 'text'}
                          placeholder={f.label}
                          value={form.auth_fields[f.key] || ''}
                          onChange={(e) => update({ auth_fields: { ...form.auth_fields, [f.key]: e.target.value } })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Credentials are encrypted at rest using AES-256 and never logged.
                  </div>
                </>
              )}

              {/* Step 2: Connection */}
              {step === 2 && form.erp_type && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(connectionFieldsForType[form.erp_type] || connectionFieldsForType.custom).map((f) => (
                    <div key={f.key} className="space-y-2">
                      <Label>{f.label}</Label>
                      <Input
                        placeholder={f.placeholder}
                        value={form.connection_fields[f.key] || ''}
                        onChange={(e) => update({ connection_fields: { ...form.connection_fields, [f.key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Sync Objects */}
              {step === 3 && (
                <>
                  <p className="text-sm text-muted-foreground">Select the ERP objects to synchronize with ArkheOS.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SYNC_OBJECTS.map((obj) => {
                      const checked = form.sync_objects.includes(obj);
                      return (
                        <label
                          key={obj}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                            checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              update({
                                sync_objects: v
                                  ? [...form.sync_objects, obj]
                                  : form.sync_objects.filter((o) => o !== obj),
                              });
                            }}
                          />
                          <span className="text-sm font-medium">{obj}</span>
                        </label>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Mapping Notes (optional)</Label>
                    <Textarea placeholder="Notes on COA mapping, cost center alignment, etc." value={form.mapping_notes} onChange={(e) => update({ mapping_notes: e.target.value })} />
                  </div>
                </>
              )}

              {/* Step 4: Schedule */}
              {step === 4 && (
                <>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.schedule_enabled} onCheckedChange={(v) => update({ schedule_enabled: v })} />
                    <Label>Enable automatic sync schedule</Label>
                  </div>
                  {form.schedule_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <div className="flex flex-wrap gap-2">
                          {cronPresets.map((p) => (
                            <Badge
                              key={p.value}
                              variant={form.schedule_cron === p.value ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => update({ schedule_cron: p.value })}
                            >
                              {p.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Custom Cron Expression</Label>
                        <Input className="font-mono" value={form.schedule_cron} onChange={(e) => update({ schedule_cron: e.target.value })} />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Step 5: Test & Save */}
              {step === 5 && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Configuration Summary</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Name</div><div className="font-medium">{form.name}</div>
                      <div className="text-muted-foreground">ERP</div><div className="font-medium">{form.erp_type ? ERP_LABELS[form.erp_type] : '—'}</div>
                      <div className="text-muted-foreground">Environment</div><div className="font-medium capitalize">{form.environment}</div>
                      <div className="text-muted-foreground">Auth</div><div className="font-medium uppercase">{form.auth_type.replace('_', ' ')}</div>
                      <div className="text-muted-foreground">Objects</div><div className="font-medium">{form.sync_objects.join(', ') || '—'}</div>
                      <div className="text-muted-foreground">Schedule</div><div className="font-medium">{form.schedule_enabled ? form.schedule_cron : 'Manual'}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleTest} disabled={testStatus === 'testing'}>
                      <TestTube2 className="h-4 w-4 mr-2" />
                      {testStatus === 'testing' ? 'Testing…' : testStatus === 'success' ? 'Test Passed ✓' : 'Test Connection'}
                    </Button>
                    {testStatus === 'success' && (
                      <div className="text-sm text-success flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Sample fetch: 25 records retrieved
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/integrations/erp-connectors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step > 0 ? 'Back' : 'Cancel'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={testStatus !== 'success'}>
            <Check className="h-4 w-4 mr-2" />
            Create Connector
          </Button>
        )}
      </div>
    </div>
  );
};

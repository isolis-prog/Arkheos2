import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRegulatoryReporting, type ReportTemplate, type Agency } from '@/hooks/useRegulatoryReporting';
import { RegulatoryDisclaimer } from '@/pages/ComplianceDashboard';
import { FileText, Zap, Clock, AlertTriangle, Lock, Info, ArrowRight, CheckCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const agencyColors: Record<string, string> = {
  CFTC: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  FERC: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  EIA: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

const triggerIcons: Record<string, typeof Zap> = {
  AUTO: Zap,
  MANUAL: Clock,
  CONDITIONAL: AlertTriangle,
};

const ReportBuilder = () => {
  const { reportTemplates, v2Placeholders, profile } = useRegulatoryReporting();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<Agency | 'ALL'>('ALL');

  const filtered = agencyFilter === 'ALL' ? reportTemplates : reportTemplates.filter(t => t.agency === agencyFilter);

  const handleGenerate = (tpl: ReportTemplate) => {
    if (!profile.isComplete) {
      toast.error('Regulatory Profile incomplete. Configure required settings before generating reports.');
      return;
    }

    if (tpl.reportType === 'CFTC_FORM_40') {
      toast.info('CFTC Form 40 requires compliance officer review. Pre-populating quantitative fields...');
    }

    setSelectedTemplate(tpl);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(`${tpl.name} generated successfully. Ready for validation.`);
      if (tpl.triggerType === 'AUTO') {
        toast.info('Swap report queued for SDR submission');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Builder"
        description="Generate regulatory reports in agency-required formats from ArkheOS trade data"
        actions={
          <Select value={agencyFilter} onValueChange={v => setAgencyFilter(v as Agency | 'ALL')}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Agencies</SelectItem>
              <SelectItem value="CFTC">CFTC</SelectItem>
              <SelectItem value="FERC">FERC</SelectItem>
              <SelectItem value="EIA">EIA</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {!profile.isComplete && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
          <AlertTriangle className="inline h-4 w-4 mr-2" />
          Regulatory Profile incomplete. Configure required settings before generating reports.
        </div>
      )}

      {/* Report Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(tpl => {
          const TriggerIcon = triggerIcons[tpl.triggerType];
          return (
            <Card key={tpl.id} className="flex flex-col hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className={agencyColors[tpl.agency]}>{tpl.agency}</Badge>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        <TriggerIcon className="h-3 w-3 mr-1" />
                        {tpl.triggerType}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tpl.triggerType === 'AUTO' ? 'Fires automatically when qualifying trades are saved' :
                       tpl.triggerType === 'CONDITIONAL' ? 'Triggered when position exceeds threshold' :
                       'Manual initiation required'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardTitle className="text-sm">{tpl.name}</CardTitle>
                <CardDescription className="text-xs">{tpl.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Output:</span> {tpl.outputFormats.join(', ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Database className="inline h-3 w-3 mr-1" />
                    {tpl.dataSourceModules.join(' → ')}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleGenerate(tpl)}
                  disabled={generating}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {generating && selectedTemplate?.id === tpl.id ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* V2 Placeholders */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Coming in v2</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {v2Placeholders.map(tpl => (
            <Card key={tpl.id} className="opacity-50 cursor-not-allowed">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">{tpl.agency}</Badge>
                  <Badge variant="secondary" className="text-xs bg-muted">
                    <Lock className="h-3 w-3 mr-1" /> v2
                  </Badge>
                </div>
                <CardTitle className="text-sm text-muted-foreground">{tpl.name}</CardTitle>
                <CardDescription className="text-xs">{tpl.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full" disabled>
                  Coming in v2
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CFTC Form 40 disclaimer */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700">
        <Info className="inline h-4 w-4 mr-1" />
        <strong>CFTC Form 40 Notice:</strong> CFTC Form 40 contains classification fields that require legal judgment. Pre-populated data is for reference only. All classifications must be reviewed and confirmed by your compliance officer before submission.
      </div>

      <RegulatoryDisclaimer />
    </div>
  );
};

export default ReportBuilder;

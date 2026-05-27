import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegulatoryReporting, type ValidationResult } from '@/hooks/useRegulatoryReporting';
import { RegulatoryDisclaimer } from '@/pages/ComplianceDashboard';
import { AIRegulatoryValidation } from '@/components/ail/AIRegulatoryValidation';
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle, RefreshCw, Send, FileSearch } from 'lucide-react';
import { toast } from 'sonner';

const PreSubmissionValidator = () => {
  const { reportTemplates, generateValidationResults } = useRegulatoryReporting();
  const [selectedReportType, setSelectedReportType] = useState('FERC_EQR');
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [validating, setValidating] = useState(false);
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);

  const runValidation = () => {
    setValidating(true);
    setAcknowledgeWarnings(false);
    setTimeout(() => {
      setValidationResults(generateValidationResults(selectedReportType));
      setValidating(false);
      toast.success('Validation complete');
    }, 1500);
  };

  const errorCount = validationResults?.filter(r => r.severity === 'ERROR').length || 0;
  const warnCount = validationResults?.filter(r => r.severity === 'WARNING').length || 0;
  const passCount = validationResults?.filter(r => r.severity === 'PASS').length || 0;
  const overallStatus = !validationResults ? null : errorCount > 0 ? 'ERRORS' : warnCount > 0 ? 'WARNINGS' : 'PASS';

  const canSubmit = overallStatus === 'PASS' || (overallStatus === 'WARNINGS' && acknowledgeWarnings);

  const tpl = reportTemplates.find(t => t.reportType === selectedReportType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-Submission Validator"
        description="Validate regulatory reports before submission to catch errors and ensure compliance"
      />

      {/* Select report */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5" /> Select Report to Validate
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-1">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportTemplates.map(t => (
                  <SelectItem key={t.reportType} value={t.reportType}>
                    {t.agency} — {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runValidation} disabled={validating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
            {validating ? 'Validating...' : 'Run Validation'}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Validation Results
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={
                  overallStatus === 'PASS' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                  overallStatus === 'WARNINGS' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                  'bg-destructive/10 text-destructive border-destructive/30'
                }>
                  {overallStatus}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {tpl?.name} | Period: Q1 2026 | Generated: {new Date().toISOString().split('T')[0]}
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-600">{passCount}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xl font-bold text-amber-600">{warnCount}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                <XCircle className="h-5 w-5 mx-auto text-destructive mb-1" />
                <p className="text-xl font-bold text-destructive">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Rule ID</th>
                    <th className="text-left py-2 font-medium">Field</th>
                    <th className="text-left py-2 font-medium">Severity</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-left py-2 font-medium">Suggested Fix</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.map(r => (
                    <tr key={r.ruleId} className={`border-b hover:bg-muted/50 ${r.severity === 'ERROR' ? 'bg-destructive/5' : r.severity === 'WARNING' ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-2 font-mono text-xs">{r.ruleId}</td>
                      <td className="py-2 font-mono text-xs">{r.field}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={
                          r.severity === 'PASS' ? 'bg-emerald-500/10 text-emerald-600' :
                          r.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-destructive/10 text-destructive'
                        }>{r.severity}</Badge>
                      </td>
                      <td className="py-2 text-xs max-w-xs">{r.description}</td>
                      <td className="py-2 text-xs text-muted-foreground max-w-xs">{r.suggestedFix || '—'}</td>
                      <td className="py-2">
                        {r.status === 'Pass' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> :
                         r.status === 'Warn' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                         <XCircle className="h-4 w-4 text-destructive" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={runValidation}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Fix & Re-validate
                </Button>
                {overallStatus === 'WARNINGS' && (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={acknowledgeWarnings} onCheckedChange={v => setAcknowledgeWarnings(!!v)} />
                    I acknowledge warnings and confirm report is ready for submission
                  </label>
                )}
              </div>
              <Button disabled={!canSubmit} onClick={() => toast.success('Report approved and ready for submission')}>
                <Send className="h-4 w-4 mr-2" />
                {errorCount > 0 ? 'Submit (Blocked — Fix Errors)' : 'Approve for Submission'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Semantic Validation */}
      {validationResults && (
        <AIRegulatoryValidation
          reportType={selectedReportType}
          validationData={{ results: validationResults, reportType: selectedReportType }}
        />
      )}

      <RegulatoryDisclaimer />
    </div>
  );
};

export default PreSubmissionValidator;

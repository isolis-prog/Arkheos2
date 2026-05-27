import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Rocket, Plus, Trash2, GripVertical, Eye, History, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useTemplateDetail, useTemplateMutations,
  type TemplateDefinition, type MatchingRuleConfig, type MatchCondition, type ExceptionCategory,
} from '@/hooks/useReconTemplates';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const EMPTY_DEFINITION: TemplateDefinition = {
  scope: { left: { source: '', dataset: '' }, right: { source: '', dataset: '' } },
  rules: [],
  filters: {},
  cutoff_rules: {},
  output: {
    result_states: ['matched', 'unmatched_left', 'unmatched_right', 'many_to_one', 'one_to_many', 'tolerance_match', 'manual_override'],
    exception_categories: [
      { name: 'Amount Mismatch', severity: 'high', sla_days: 3 },
      { name: 'Missing Counterpart', severity: 'medium', sla_days: 5 },
      { name: 'Date Variance', severity: 'low', sla_days: 7 },
    ],
  },
};

const EMPTY_RULE: MatchingRuleConfig = {
  name: '',
  priority: 1,
  conditions: [{ left_field: '', right_field: '', comparator: 'exact', required: true }],
  tolerances: {},
  is_active: true,
};

const SOURCE_SYSTEMS = ['ETRM', 'ERP', 'BANK', 'TMS'];
const DATASETS = ['Deals', 'Fees', 'Invoices', 'Vouchers', 'Settlements', 'AP/AR', 'Payment Runs'];
const COMPARATORS = [
  { value: 'exact', label: 'Exact match' },
  { value: 'fuzzy', label: 'Fuzzy match' },
  { value: 'numeric_tolerance', label: 'Numeric (tolerance)' },
  { value: 'date_tolerance', label: 'Date (tolerance)' },
  { value: 'contains', label: 'Contains' },
];
const FIELDS = ['deal_id', 'counterparty', 'amount', 'currency', 'fee_type', 'invoice_number', 'trade_date', 'settlement_date', 'value_date', 'legal_entity', 'description', 'reference', 'memo', 'doc_id', 'line_id'];

export function TemplateBuilder() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = templateId === 'new';

  const { template, versions, auditLog, isLoading } = useTemplateDetail(isNew ? undefined : templateId);
  const { createTemplate, updateTemplate, saveVersion, publishTemplate } = useTemplateMutations();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [templateType, setTemplateType] = useState('fees_netsuite');
  const [leftSource, setLeftSource] = useState('ETRM');
  const [leftDataset, setLeftDataset] = useState('Fees');
  const [rightSource, setRightSource] = useState('ERP');
  const [rightDataset, setRightDataset] = useState('Invoices');
  const [definition, setDefinition] = useState<TemplateDefinition>(EMPTY_DEFINITION);
  const [changeReason, setChangeReason] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // Load existing template
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setTags((template.tags || []).join(', '));
      setTemplateType(template.template_type);
      setLeftSource(template.side_a_source);
      setLeftDataset(template.side_a_dataset);
      setRightSource(template.side_b_source);
      setRightDataset(template.side_b_dataset);
    }
  }, [template]);

  // Load latest version definition
  useEffect(() => {
    if (versions.length > 0) {
      const latest = versions[0];
      if (latest.definition_json) {
        setDefinition(latest.definition_json);
      }
    }
  }, [versions]);

  const currentVersion = versions[0];
  const canPublish = name.trim() && leftSource && rightSource && definition.rules.some((r) => r.is_active);

  // ─── Rule management ───
  const addRule = () => {
    setDefinition((d) => ({
      ...d,
      rules: [...d.rules, { ...EMPTY_RULE, priority: d.rules.length + 1, name: `Rule ${d.rules.length + 1}` }],
    }));
  };

  const updateRule = (idx: number, updates: Partial<MatchingRuleConfig>) => {
    setDefinition((d) => ({
      ...d,
      rules: d.rules.map((r, i) => (i === idx ? { ...r, ...updates } : r)),
    }));
  };

  const removeRule = (idx: number) => {
    setDefinition((d) => ({ ...d, rules: d.rules.filter((_, i) => i !== idx) }));
  };

  const addCondition = (ruleIdx: number) => {
    setDefinition((d) => ({
      ...d,
      rules: d.rules.map((r, i) =>
        i === ruleIdx
          ? { ...r, conditions: [...r.conditions, { left_field: '', right_field: '', comparator: 'exact' as const, required: true }] }
          : r
      ),
    }));
  };

  const updateCondition = (ruleIdx: number, condIdx: number, updates: Partial<MatchCondition>) => {
    setDefinition((d) => ({
      ...d,
      rules: d.rules.map((r, i) =>
        i === ruleIdx
          ? { ...r, conditions: r.conditions.map((c, ci) => (ci === condIdx ? { ...c, ...updates } : c)) }
          : r
      ),
    }));
  };

  const removeCondition = (ruleIdx: number, condIdx: number) => {
    setDefinition((d) => ({
      ...d,
      rules: d.rules.map((r, i) =>
        i === ruleIdx ? { ...r, conditions: r.conditions.filter((_, ci) => ci !== condIdx) } : r
      ),
    }));
  };

  // ─── Exception categories ───
  const addExceptionCategory = () => {
    setDefinition((d) => ({
      ...d,
      output: {
        ...d.output,
        exception_categories: [...d.output.exception_categories, { name: '', severity: 'medium', sla_days: 5 }],
      },
    }));
  };

  const updateExceptionCategory = (idx: number, updates: Partial<ExceptionCategory>) => {
    setDefinition((d) => ({
      ...d,
      output: {
        ...d.output,
        exception_categories: d.output.exception_categories.map((c, i) => (i === idx ? { ...c, ...updates } : c)),
      },
    }));
  };

  const removeExceptionCategory = (idx: number) => {
    setDefinition((d) => ({
      ...d,
      output: { ...d.output, exception_categories: d.output.exception_categories.filter((_, i) => i !== idx) },
    }));
  };

  // ─── Save & Publish ───
  const handleSave = async () => {
    if (!changeReason.trim()) {
      toast({ title: 'Change reason required', description: 'Please describe what changed', variant: 'destructive' });
      return;
    }

    const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (isNew) {
      const result = await createTemplate.mutateAsync({
        name, description, template_type: templateType, tags: tagsArr,
        side_a_source: leftSource, side_a_dataset: leftDataset,
        side_b_source: rightSource, side_b_dataset: rightDataset,
      });

      // Save first version
      const defWithScope: TemplateDefinition = {
        ...definition,
        scope: {
          left: { source: leftSource, dataset: leftDataset },
          right: { source: rightSource, dataset: rightDataset },
        },
      };
      await saveVersion.mutateAsync({
        template_id: (result as any).id,
        definition_json: defWithScope,
        change_reason: changeReason,
      });

      navigate(`/reconciliations/templates/${(result as any).id}`);
    } else if (templateId) {
      await updateTemplate.mutateAsync({
        id: templateId,
        updates: {
          name, description, tags: tagsArr,
          side_a_source: leftSource, side_a_dataset: leftDataset,
          side_b_source: rightSource, side_b_dataset: rightDataset,
        } as any,
      });

      const defWithScope: TemplateDefinition = {
        ...definition,
        scope: {
          left: { source: leftSource, dataset: leftDataset },
          right: { source: rightSource, dataset: rightDataset },
        },
      };
      await saveVersion.mutateAsync({
        template_id: templateId,
        definition_json: defWithScope,
        change_reason: changeReason,
      });
    }
    setChangeReason('');
  };

  const handlePublish = async () => {
    if (!templateId || !currentVersion) return;
    await publishTemplate.mutateAsync({
      template_id: templateId,
      version_id: currentVersion.id,
    });
    setPublishDialogOpen(false);
  };

  if (!isNew && isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading template…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reconciliations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'New Template' : name || 'Template Builder'}
            </h1>
            {template && (
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge variant={template.template_status === 'published' ? 'success' : 'info'}>
                  {template.template_status}
                </StatusBadge>
                {currentVersion && (
                  <span className="text-sm text-muted-foreground">v{currentVersion.version_number}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={!changeReason.trim()}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          {!isNew && (
            <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canPublish}>
                  <Rocket className="mr-2 h-4 w-4" /> Publish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publish Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Publishing will make this template available for reconciliation runs.
                    Version {currentVersion?.version_number} will become the active version.
                  </p>
                  {!canPublish && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Cannot publish: ensure scope and at least 1 active rule are defined.</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handlePublish} disabled={!canPublish}>Confirm Publish</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Change reason (always visible) */}
      <Card>
        <CardContent className="pt-4">
          <Label>Change reason (required to save)</Label>
          <Input
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Describe what you changed…"
            className="mt-1"
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="basics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="scope">Scope & Systems</TabsTrigger>
          <TabsTrigger value="rules">Matching Rules</TabsTrigger>
          <TabsTrigger value="output">Output & Exceptions</TabsTrigger>
          <TabsTrigger value="audit">Audit & Versions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* ─── A. Basics ─── */}
        <TabsContent value="basics">
          <Card>
            <CardHeader>
              <CardTitle>Template Basics</CardTitle>
              <CardDescription>Core metadata for this reconciliation template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fees ETRM ↔ NetSuite" />
                </div>
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fees_netsuite">Fees ↔ NetSuite</SelectItem>
                      <SelectItem value="invoice_erp">Invoice ↔ AP/AR</SelectItem>
                      <SelectItem value="settlement">Settlement ↔ Bank</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fees, monthly, critical" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── B. Scope & Systems ─── */}
        <TabsContent value="scope">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Left Dataset (Side A)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source System</Label>
                  <Select value={leftSource} onValueChange={setLeftSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select value={leftDataset} onValueChange={setLeftDataset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATASETS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Right Dataset (Side B)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source System</Label>
                  <Select value={rightSource} onValueChange={setRightSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select value={rightDataset} onValueChange={setRightDataset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATASETS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── C. Matching Rules ─── */}
        <TabsContent value="rules">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Matching Rules</h3>
                <p className="text-sm text-muted-foreground">Configure rules with priority ordering. Higher priority rules are evaluated first.</p>
              </div>
              <Button onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" /> Add Rule
              </Button>
            </div>

            {definition.rules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No matching rules defined yet.</p>
                  <Button variant="outline" className="mt-3" onClick={addRule}>
                    <Plus className="mr-2 h-4 w-4" /> Add First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              definition.rules.map((rule, rIdx) => (
                <motion.div key={rIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {rule.priority}
                            </span>
                            <Input
                              value={rule.name}
                              onChange={(e) => updateRule(rIdx, { name: e.target.value })}
                              className="font-semibold border-0 p-0 h-auto text-base focus-visible:ring-0"
                              placeholder="Rule name"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Active</Label>
                            <Switch checked={rule.is_active} onCheckedChange={(v) => updateRule(rIdx, { is_active: v })} />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeRule(rIdx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Conditions */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Keys</Label>
                        {rule.conditions.map((cond, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            {cIdx > 0 && (
                              <span className="text-xs font-semibold text-muted-foreground w-8 text-center">AND</span>
                            )}
                            <Select value={cond.left_field} onValueChange={(v) => updateCondition(rIdx, cIdx, { left_field: v })}>
                              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Left field" /></SelectTrigger>
                              <SelectContent>
                                {FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select value={cond.comparator} onValueChange={(v: any) => updateCondition(rIdx, cIdx, { comparator: v })}>
                              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {COMPARATORS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select value={cond.right_field} onValueChange={(v) => updateCondition(rIdx, cIdx, { right_field: v })}>
                              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Right field" /></SelectTrigger>
                              <SelectContent>
                                {FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {(cond.comparator === 'numeric_tolerance' || cond.comparator === 'date_tolerance') && (
                              <Input
                                type="number"
                                className="w-20"
                                placeholder="±"
                                value={cond.tolerance_value ?? ''}
                                onChange={(e) => updateCondition(rIdx, cIdx, { tolerance_value: Number(e.target.value) })}
                              />
                            )}
                            <div className="flex items-center gap-1">
                              <Label className="text-xs">Req</Label>
                              <Switch
                                checked={cond.required}
                                onCheckedChange={(v) => updateCondition(rIdx, cIdx, { required: v })}
                              />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeCondition(rIdx, cIdx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addCondition(rIdx)}>
                          <Plus className="mr-1 h-3 w-3" /> Add condition
                        </Button>
                      </div>

                      {/* Human-readable preview */}
                      <Separator />
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Rule preview:</p>
                        <p className="font-mono text-xs">
                          {rule.conditions.map((c, i) => (
                            <span key={i}>
                              {i > 0 && ' AND '}
                              {c.left_field || '?'} {c.comparator === 'exact' ? '=' : `≈(${c.comparator}${c.tolerance_value ? ` ±${c.tolerance_value}` : ''})`} {c.right_field || '?'}
                              {!c.required && ' [optional]'}
                            </span>
                          ))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── E. Output & Exception Handling ─── */}
        <TabsContent value="output">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Result States</CardTitle>
                <CardDescription>Output classifications for reconciliation results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {definition.output.result_states.map((state) => (
                    <span key={state} className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                      {state.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Exception Categories</CardTitle>
                    <CardDescription>Define severity levels and SLA targets for exceptions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addExceptionCategory}>
                    <Plus className="mr-1 h-3 w-3" /> Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>SLA (days)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {definition.output.exception_categories.map((cat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={cat.name}
                            onChange={(e) => updateExceptionCategory(idx, { name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={cat.severity} onValueChange={(v: any) => updateExceptionCategory(idx, { severity: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={cat.sla_days}
                            onChange={(e) => updateExceptionCategory(idx, { sla_days: Number(e.target.value) })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeExceptionCategory(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── F. Audit & Versions ─── */}
        <TabsContent value="audit">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No versions yet. Save a draft to create v1.</p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => (
                      <div key={v.id} className="flex items-start justify-between p-3 rounded-lg border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">v{v.version_number}</span>
                            {v.is_published && <StatusBadge variant="success">Published</StatusBadge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{v.change_reason || 'No description'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit events yet.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-sm">
                        <StatusBadge variant={entry.action === 'publish' ? 'success' : entry.action === 'archive' ? 'muted' : 'info'}>
                          {entry.action}
                        </StatusBadge>
                        <span className="text-muted-foreground">
                          {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── G. Preview ─── */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>Summary of the current template configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground">Scope</p>
                  <p className="font-mono text-sm mt-1">{leftSource}: {leftDataset}</p>
                  <p className="font-mono text-sm">↔ {rightSource}: {rightDataset}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">{definition.rules.filter((r) => r.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">of {definition.rules.length} total</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground">Exception Categories</p>
                  <p className="text-2xl font-bold">{definition.output.exception_categories.length}</p>
                </div>
              </div>

              <Separator />

              {/* Rules summary */}
              <div>
                <h4 className="font-semibold mb-3">Rules Summary</h4>
                {definition.rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rules configured.</p>
                ) : (
                  <div className="space-y-2">
                    {definition.rules.map((rule, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${!rule.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                            P{rule.priority}
                          </span>
                          <span className="font-medium">{rule.name}</span>
                          {!rule.is_active && <StatusBadge variant="muted">Inactive</StatusBadge>}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          {rule.conditions.map((c, i) => (
                            <span key={i}>
                              {i > 0 && ' AND '}
                              {c.left_field || '?'} {c.comparator} {c.right_field || '?'}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Validation */}
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Publish Readiness</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Template name set', ok: !!name.trim() },
                    { label: 'Left system defined', ok: !!leftSource },
                    { label: 'Right system defined', ok: !!rightSource },
                    { label: 'At least 1 active rule', ok: definition.rules.some((r) => r.is_active) },
                    { label: 'All rules have match keys', ok: definition.rules.every((r) => r.conditions.length > 0 && r.conditions.every((c) => c.left_field && c.right_field)) },
                  ].map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${check.ok ? 'bg-success' : 'bg-destructive'}`} />
                      <span className={check.ok ? 'text-foreground' : 'text-destructive'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

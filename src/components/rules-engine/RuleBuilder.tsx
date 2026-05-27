import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Plus, GripVertical, Trash2, ToggleLeft, ToggleRight, Zap, ArrowRight } from 'lucide-react';
import { Ruleset, RuleDefinition, OPERATORS, AVAILABLE_FIELDS } from '@/hooks/useRulesEngine';

interface Props {
  ruleset: Ruleset;
  onBack: () => void;
}

const actionTypeLabel: Record<string, string> = {
  match: 'Match', transform: 'Transform', set_tolerance: 'Set Tolerance',
  auto_close: 'Auto-close', auto_assign: 'Auto-assign', set_severity: 'Set Severity',
};

const actionTypeColor: Record<string, string> = {
  match: 'bg-info/10 text-info', transform: 'bg-accent/80 text-accent-foreground',
  set_tolerance: 'bg-warning/10 text-warning', auto_close: 'bg-success/10 text-success',
  auto_assign: 'bg-primary/10 text-primary', set_severity: 'bg-destructive/10 text-destructive',
};

export const RuleBuilder = ({ ruleset, onBack }: Props) => {
  const rules = ruleset.current_version?.definition.rules || ruleset.versions[0]?.definition.rules || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{ruleset.name}</h2>
          <p className="text-sm text-muted-foreground">{ruleset.description}</p>
        </div>
        <StatusBadge variant={ruleset.status === 'active' ? 'success' : ruleset.status === 'review' ? 'warning' : 'info'}>{ruleset.status}</StatusBadge>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
      </div>

      {/* Rules */}
      <Accordion type="multiple" defaultValue={rules.map(r => r.id)} className="space-y-3">
        {rules.sort((a, b) => a.priority - b.priority).map((rule, idx) => (
          <AccordionItem key={rule.id} value={rule.id} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Badge variant="outline" className="text-xs font-mono">P{rule.priority}</Badge>
                <span className="font-medium">{rule.name}</span>
                <div className="flex gap-1 ml-auto mr-4">
                  {rule.actions.map(a => (
                    <Badge key={a.id} className={`text-xs ${actionTypeColor[a.type] || ''}`}>{actionTypeLabel[a.type]}</Badge>
                  ))}
                </div>
                {rule.enabled ? (
                  <ToggleRight className="h-5 w-5 text-success" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 space-y-4">
                {/* Conditions */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />Conditions
                  </h4>
                  <div className="space-y-2">
                    {rule.conditions.map((cond, ci) => (
                      <div key={cond.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                        {ci > 0 && <Badge variant="secondary" className="text-xs">{cond.logic}</Badge>}
                        <code className="bg-background px-2 py-1 rounded text-xs font-mono border">{cond.left_field}</code>
                        <Badge variant="outline" className="text-xs">{OPERATORS.find(o => o.value === cond.operator)?.label || cond.operator}</Badge>
                        {cond.right_field ? (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <code className="bg-background px-2 py-1 rounded text-xs font-mono border">{cond.right_field}</code>
                          </>
                        ) : null}
                        {cond.value !== undefined && (
                          <Badge variant="default" className="text-xs font-mono">{String(cond.value)}</Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2"><Plus className="h-3 w-3 mr-1" />Add Condition</Button>
                </div>

                <Separator />

                {/* Actions */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Actions</h4>
                  <div className="space-y-2">
                    {rule.actions.map(action => (
                      <div key={action.id} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${actionTypeColor[action.type] || ''}`}>{actionTypeLabel[action.type]}</Badge>
                        </div>
                        <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-20 font-mono">
                          {JSON.stringify(action.config, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human-readable preview */}
                <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rule Preview (Audit)</p>
                  <p className="text-sm">
                    <strong>IF</strong>{' '}
                    {rule.conditions.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && <em className="text-muted-foreground"> {c.logic} </em>}
                        <code className="text-xs">{c.left_field}</code>
                        {' '}{c.operator.replace(/_/g, ' ')}{' '}
                        {c.right_field ? <code className="text-xs">{c.right_field}</code> : null}
                        {c.value !== undefined ? <code className="text-xs"> ({String(c.value)})</code> : null}
                      </span>
                    ))}
                    {' '}<strong>THEN</strong>{' '}
                    {rule.actions.map(a => actionTypeLabel[a.type]).join(', ')}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Version History */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Version History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ruleset.versions.map(v => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-xs">v{v.version_number}</Badge>
                <span className="text-sm flex-1">{v.change_reason}</span>
                <span className="text-xs text-muted-foreground">{v.created_by}</span>
                {v.is_active && <StatusBadge variant="success">Active</StatusBadge>}
                {v.approved_by && <Badge variant="outline" className="text-xs">Approved</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface TemplateDefinition {
  scope: {
    left: { source: string; dataset: string };
    right: { source: string; dataset: string };
  };
  rules: MatchingRuleConfig[];
  filters: Record<string, any>;
  cutoff_rules: Record<string, any>;
  output: {
    result_states: string[];
    exception_categories: ExceptionCategory[];
  };
  transformations?: TransformConfig[];
}

export interface MatchingRuleConfig {
  id?: string;
  name: string;
  priority: number;
  conditions: MatchCondition[];
  tolerances: Record<string, any>;
  is_active: boolean;
  transformations?: string[];
}

export interface MatchCondition {
  left_field: string;
  right_field: string;
  comparator: 'exact' | 'fuzzy' | 'numeric_tolerance' | 'date_tolerance' | 'contains';
  required: boolean;
  tolerance_value?: number;
  tolerance_unit?: 'percent' | 'absolute' | 'days';
}

export interface TransformConfig {
  field: string;
  transforms: ('trim' | 'uppercase' | 'lowercase' | 'remove_spaces' | 'date_normalize' | 'numeric_round')[];
}

export interface ExceptionCategory {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sla_days: number;
  required_fields?: string[];
}

export interface ReconTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  template_type: string;
  side_a_source: string;
  side_a_dataset: string;
  side_b_source: string;
  side_b_dataset: string;
  filters: Record<string, any> | null;
  cutoff_rules: Record<string, any> | null;
  is_active: boolean | null;
  template_status: string;
  tags: string[];
  current_version_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  definition_json: TemplateDefinition;
  checksum: string | null;
  change_reason: string | null;
  created_by: string | null;
  created_at: string;
  is_published: boolean;
}

export interface TemplateAuditEntry {
  id: string;
  tenant_id: string;
  template_id: string;
  version_id: string | null;
  action: string;
  actor_user_id: string | null;
  created_at: string;
  metadata_json: Record<string, any>;
}

// ─── List templates ───
export function useTemplateList() {
  return useQuery({
    queryKey: ['recon-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reconciliation_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReconTemplate[];
    },
  });
}

// ─── Single template with versions ───
export function useTemplateDetail(templateId: string | undefined) {
  const templateQuery = useQuery({
    queryKey: ['recon-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from('reconciliation_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (error) throw error;
      return data as unknown as ReconTemplate;
    },
    enabled: !!templateId,
  });

  const versionsQuery = useQuery({
    queryKey: ['recon-template-versions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('recon_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TemplateVersion[];
    },
    enabled: !!templateId,
  });

  const auditQuery = useQuery({
    queryKey: ['recon-template-audit', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('recon_template_audit_log')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TemplateAuditEntry[];
    },
    enabled: !!templateId,
  });

  return {
    template: templateQuery.data,
    versions: versionsQuery.data ?? [],
    auditLog: auditQuery.data ?? [],
    isLoading: templateQuery.isLoading || versionsQuery.isLoading,
    refetch: () => {
      templateQuery.refetch();
      versionsQuery.refetch();
      auditQuery.refetch();
    },
  };
}

// ─── Template mutations ───
export function useTemplateMutations() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['recon-templates'] });
    qc.invalidateQueries({ queryKey: ['recon-template'] });
    qc.invalidateQueries({ queryKey: ['recon-template-versions'] });
    qc.invalidateQueries({ queryKey: ['recon-template-audit'] });
  };

  const createTemplate = useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      template_type: string;
      tags: string[];
      side_a_source: string;
      side_a_dataset: string;
      side_b_source: string;
      side_b_dataset: string;
    }) => {
      const { data, error } = await supabase
        .from('reconciliation_templates')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          name: params.name,
          description: params.description,
          template_type: params.template_type,
          tags: params.tags,
          side_a_source: params.side_a_source,
          side_a_dataset: params.side_a_dataset,
          side_b_source: params.side_b_source,
          side_b_dataset: params.side_b_dataset,
          template_status: 'draft',
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Template created', description: 'New reconciliation template created as draft' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateTemplate = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ReconTemplate> }) => {
      const { data, error } = await supabase
        .from('reconciliation_templates')
        .update(params.updates as any)
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Template updated' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const saveVersion = useMutation({
    mutationFn: async (params: {
      template_id: string;
      definition_json: TemplateDefinition;
      change_reason: string;
    }) => {
      // Get next version number
      const { data: existing } = await supabase
        .from('recon_template_versions')
        .select('version_number')
        .eq('template_id', params.template_id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (existing && existing.length > 0 ? (existing[0] as any).version_number : 0) + 1;

      const { data, error } = await supabase
        .from('recon_template_versions')
        .insert({
          template_id: params.template_id,
          version_number: nextVersion,
          definition_json: params.definition_json as any,
          change_reason: params.change_reason,
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Version saved', description: 'New draft version created' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const publishTemplate = useMutation({
    mutationFn: async (params: { template_id: string; version_id: string }) => {
      // Mark version as published
      const { error: vErr } = await supabase
        .from('recon_template_versions')
        .update({ is_published: true })
        .eq('id', params.version_id);
      if (vErr) throw vErr;

      // Update template
      const { error: tErr } = await supabase
        .from('reconciliation_templates')
        .update({
          current_version_id: params.version_id,
          template_status: 'published',
          is_active: true,
        } as any)
        .eq('id', params.template_id);
      if (tErr) throw tErr;

      // Audit log
      await supabase.from('recon_template_audit_log').insert({
        tenant_id: DEMO_TENANT_ID,
        template_id: params.template_id,
        version_id: params.version_id,
        action: 'publish',
        metadata_json: {},
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Template published', description: 'Template is now live for reconciliation runs' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const archiveTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('reconciliation_templates')
        .update({ template_status: 'archived', is_active: false } as any)
        .eq('id', templateId);
      if (error) throw error;

      await supabase.from('recon_template_audit_log').insert({
        tenant_id: DEMO_TENANT_ID,
        template_id: templateId,
        action: 'archive',
        metadata_json: {},
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Template archived' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      // Fetch original
      const { data: orig, error: fErr } = await supabase
        .from('reconciliation_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (fErr) throw fErr;
      const o = orig as any;

      // Create copy
      const { data: copy, error: cErr } = await supabase
        .from('reconciliation_templates')
        .insert({
          tenant_id: o.tenant_id,
          name: `${o.name} (copy)`,
          description: o.description,
          template_type: o.template_type,
          tags: o.tags || [],
          side_a_source: o.side_a_source,
          side_a_dataset: o.side_a_dataset,
          side_b_source: o.side_b_source,
          side_b_dataset: o.side_b_dataset,
          template_status: 'draft',
          is_active: false,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      // Copy latest version definition
      const { data: versions } = await supabase
        .from('recon_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versions && versions.length > 0) {
        await supabase.from('recon_template_versions').insert({
          template_id: (copy as any).id,
          version_number: 1,
          definition_json: (versions[0] as any).definition_json,
          change_reason: `Duplicated from ${o.name}`,
          is_published: false,
        });
      }

      await supabase.from('recon_template_audit_log').insert({
        tenant_id: DEMO_TENANT_ID,
        template_id: (copy as any).id,
        action: 'duplicate',
        metadata_json: { source_template_id: templateId },
      });

      return copy;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Template duplicated', description: 'A draft copy has been created' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return {
    createTemplate,
    updateTemplate,
    saveVersion,
    publishTemplate,
    archiveTemplate,
    duplicateTemplate,
  };
}

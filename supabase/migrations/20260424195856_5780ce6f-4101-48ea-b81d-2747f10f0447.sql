CREATE OR REPLACE FUNCTION public.e2e_seed_matching_run(p_tenant_id uuid)
RETURNS TABLE(run_id uuid, exception_case_id uuid, doc_id text, deal_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid := gen_random_uuid();
  v_case_id uuid := gen_random_uuid();
  v_doc_id text := 'E2E-DOC-' || replace(v_run_id::text, '-', '');
  v_deal_id text := 'E2E-DEAL-' || replace(v_run_id::text, '-', '');
  v_template_id uuid;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'p_tenant_id is required';
  END IF;

  SELECT id INTO v_template_id
    FROM public.reconciliation_templates
   WHERE tenant_id = p_tenant_id AND template_type = 'e2e'
   LIMIT 1;

  IF v_template_id IS NULL THEN
    INSERT INTO public.reconciliation_templates (
      tenant_id, name, description, template_type,
      side_a_source, side_a_dataset, side_b_source, side_b_dataset, is_active
    ) VALUES (
      p_tenant_id, 'E2E test template', 'Auto-generated for end-to-end tests', 'e2e',
      'e2e', 'e2e', 'e2e', 'e2e', false
    )
    RETURNING id INTO v_template_id;
  END IF;

  -- Insert into BOTH run tables with the same id
  INSERT INTO public.recon_runs (
    id, tenant_id, period_start, period_end, status, metrics
  ) VALUES (
    v_run_id, p_tenant_id, current_date, current_date, 'completed', jsonb_build_object('e2e', true)
  );

  INSERT INTO public.reconciliation_runs (
    id, tenant_id, template_id, status, started_at, completed_at, metrics
  ) VALUES (
    v_run_id, p_tenant_id, v_template_id, 'completed', now(), now(), jsonb_build_object('e2e', true)
  );

  INSERT INTO public.exception_cases (
    id, tenant_id, run_id, exception_type, status, severity, summary
  ) VALUES (
    v_case_id, p_tenant_id, v_run_id, 'amount_mismatch', 'open', 'medium', 'E2E fixture'
  );

  INSERT INTO public.break_details (
    exception_case_id, tenant_id, run_id, doc_id, doc_type,
    side_a_amount, side_b_amount, amount_delta, currency,
    break_category, suggested_root_cause, ai_confidence
  ) VALUES (
    v_case_id, p_tenant_id, v_run_id, v_doc_id, 'invoice',
    1000.00, 950.00, 50.00, 'USD',
    'e2e_fixture', 'E2E seeded break', 0.99
  );

  INSERT INTO public.document_trade_links (
    tenant_id, doc_id, doc_type, deal_id, allocation_amount, link_source, ai_confidence
  ) VALUES (
    p_tenant_id, v_doc_id, 'invoice', v_deal_id, 1000.00, 'e2e_fixture', 0.99
  );

  RETURN QUERY SELECT v_run_id, v_case_id, v_doc_id, v_deal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.e2e_cleanup_matching_run(p_run_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_ids text[];
  v_is_e2e_a boolean;
  v_is_e2e_b boolean;
BEGIN
  IF p_run_id IS NULL THEN
    RAISE EXCEPTION 'p_run_id is required';
  END IF;

  SELECT (metrics->>'e2e')::boolean INTO v_is_e2e_a
    FROM public.reconciliation_runs WHERE id = p_run_id;
  SELECT (metrics->>'e2e')::boolean INTO v_is_e2e_b
    FROM public.recon_runs WHERE id = p_run_id;

  IF COALESCE(v_is_e2e_a, false) IS NOT TRUE AND COALESCE(v_is_e2e_b, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'run % is not an e2e fixture', p_run_id;
  END IF;

  SELECT array_agg(DISTINCT doc_id)
    INTO v_doc_ids
    FROM public.break_details
   WHERE run_id = p_run_id AND break_category = 'e2e_fixture';

  DELETE FROM public.break_details
   WHERE run_id = p_run_id AND break_category = 'e2e_fixture';

  DELETE FROM public.exception_cases WHERE run_id = p_run_id;

  IF v_doc_ids IS NOT NULL THEN
    DELETE FROM public.document_trade_links
     WHERE doc_id = ANY(v_doc_ids) AND link_source = 'e2e_fixture';
  END IF;

  DELETE FROM public.reconciliation_runs WHERE id = p_run_id;
  DELETE FROM public.recon_runs WHERE id = p_run_id;
END;
$$;
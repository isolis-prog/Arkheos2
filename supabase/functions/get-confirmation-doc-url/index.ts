import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface DocUrlRequest {
  confirmationDocId: string;
}

interface DocUrlResponse {
  available: boolean;
  signedUrl?: string;
  reason?: string;
}

type ErrorCode =
  | 'MISSING_AUTH'
  | 'INVALID_AUTH'
  | 'SERVER_MISCONFIGURED'
  | 'INVALID_JSON'
  | 'INVALID_INPUT'
  | 'METHOD_NOT_ALLOWED'
  | 'DOC_FETCH_FAILED'
  | 'DOC_NOT_FOUND'
  | 'TENANT_FORBIDDEN'
  | 'STORAGE_PATH_INVALID'
  | 'SIGN_URL_FAILED'
  | 'INTERNAL_ERROR';

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return new Response(
    JSON.stringify({
      error: { code, message, ...(details ? { details } : {}) },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', `Method ${req.method} not allowed. Use POST.`);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(401, 'MISSING_AUTH', 'Missing Authorization header. Sign in and retry.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return errorResponse(
        500,
        'SERVER_MISCONFIGURED',
        'Edge function is missing required environment variables.',
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Pass the JWT explicitly — supabase-js getUser() without args reads from
    // the local session store, which is empty in edge-function context.
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userRes, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return errorResponse(
        401,
        'INVALID_AUTH',
        'Authentication token is invalid or expired.',
        userErr ? { reason: userErr.message } : undefined,
      );
    }

    let body: DocUrlRequest;
    try {
      body = (await req.json()) as DocUrlRequest;
    } catch (e) {
      return errorResponse(400, 'INVALID_JSON', 'Request body is not valid JSON.', {
        reason: e instanceof Error ? e.message : String(e),
      });
    }

    if (!body?.confirmationDocId || typeof body.confirmationDocId !== 'string') {
      return errorResponse(
        400,
        'INVALID_INPUT',
        '`confirmationDocId` is required and must be a string.',
      );
    }

    // Fetch the doc through user-scoped client so RLS validates tenant + role.
    const { data: doc, error: docErr } = await userClient
      .from('confirmation_documents')
      .select('confirmation_doc_id, storage_path, tenant_id')
      .eq('confirmation_doc_id', body.confirmationDocId)
      .maybeSingle();

    if (docErr) {
      return errorResponse(403, 'DOC_FETCH_FAILED', 'Could not load confirmation document (RLS or query error).', {
        reason: docErr.message,
        confirmationDocId: body.confirmationDocId,
      });
    }
    if (!doc) {
      return errorResponse(
        404,
        'DOC_NOT_FOUND',
        'Confirmation document not found or access denied for this tenant.',
        { confirmationDocId: body.confirmationDocId },
      );
    }

    // Defense-in-depth: explicitly verify the caller belongs to the doc's tenant.
    const { data: belongs, error: belongsErr } = await userClient.rpc('user_belongs_to_tenant', {
      _user_id: userRes.user.id,
      _tenant_id: doc.tenant_id,
    });
    if (belongsErr || belongs !== true) {
      try {
        const adminAudit = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await adminAudit.from('audit_events').insert({
          tenant_id: doc.tenant_id,
          module_key: 'confirmations_recon',
          entity_type: 'confirmation_document',
          entity_id: doc.confirmation_doc_id,
          action: 'CONFIRMATION_DOC_VIEW_DENIED',
          actor_id: userRes.user.id,
          summary: 'Tenant authorization check failed for confirmation document',
        });
      } catch { /* non-blocking */ }

      return errorResponse(
        403,
        'TENANT_FORBIDDEN',
        'User does not have access to this tenant.',
        belongsErr ? { reason: belongsErr.message } : undefined,
      );
    }

    if (!doc.storage_path) {
      const response: DocUrlResponse = {
        available: false,
        reason: 'No source file is stored for this confirmation (demo data).',
      };
      return jsonResponse(response, 200);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [bucket, ...pathParts] = doc.storage_path.split('/');
    const objectPath = pathParts.join('/');
    if (!bucket || !objectPath) {
      return errorResponse(
        500,
        'STORAGE_PATH_INVALID',
        'Stored document path is malformed (expected `bucket/object/path`).',
        { storage_path: doc.storage_path },
      );
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(objectPath, 600);

    if (signErr || !signed?.signedUrl) {
      return errorResponse(
        502,
        'SIGN_URL_FAILED',
        'Could not generate signed URL for the document.',
        { reason: signErr?.message ?? 'unknown', bucket, objectPath },
      );
    }

    // Audit log (best-effort)
    try {
      await adminClient.from('audit_events').insert({
        tenant_id: doc.tenant_id,
        module_key: 'confirmations_recon',
        entity_type: 'confirmation_document',
        entity_id: doc.confirmation_doc_id,
        action: 'CONFIRMATION_DOC_VIEW',
        actor_id: userRes.user.id,
        summary: 'Signed URL issued for confirmation document',
      });
    } catch {
      /* non-blocking */
    }

    const response: DocUrlResponse = { available: true, signedUrl: signed.signedUrl };
    return jsonResponse(response, 200);
  } catch (err) {
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Unexpected error while processing the request.',
      { reason: err instanceof Error ? err.message : String(err) },
    );
  }
});

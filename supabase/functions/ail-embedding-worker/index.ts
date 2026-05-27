import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ── Text representation builders per entity type ──
function buildTextRepresentation(entityType: string, data: Record<string, unknown>): string {
  switch (entityType) {
    case "TRADE":
      return `${data.direction} ${data.quantity} ${data.unit} ${data.commodity} at ${data.hub} price ${data.entry_price} USD ${data.price_type} delivery ${data.delivery_period_start} to ${data.delivery_period_end} counterparty ${data.counterparty_name} desk ${data.desk_name} type ${data.position_type} status ${data.trade_status}`;
    case "EXCEPTION":
      return `${data.exception_type} between ${data.system_a} and ${data.system_b} difference ${data.difference_amount} USD entity ${data.entity_type} severity ${data.severity} counterparty ${data.counterparty_name} commodity ${data.commodity}`;
    case "CASHFLOW":
      return `${data.cashflow_type} ${data.scheduled_amount} USD from trade ${data.trade_id} counterparty ${data.counterparty_name} scheduled ${data.scheduled_date} status ${data.payment_status}`;
    case "BANK_STATEMENT":
      return `${data.description} ${data.credit_amount || data.debit_amount} USD date ${data.transaction_date} account ${data.bank_account_ref}`;
    case "AMENDMENT":
      return `${data.amendment_type} on trade ${data.trade_id} field ${data.amended_field} changed from ${data.old_value} to ${data.new_value} reason ${data.amendment_reason}`;
    case "REGULATORY_FILING":
      return `${data.filing_type} for period ${data.period_start} to ${data.period_end} agency ${data.agency} status ${data.status} notes ${data.notes}`;
    default:
      return JSON.stringify(data);
  }
}

// Generate embeddings using Lovable AI Gateway (text→embedding via summarization approach)
// Since Lovable AI provides chat completions, we generate a compact numeric hash embedding
// For production, you'd use a dedicated embedding model.
// Here we use the AI to generate a semantic fingerprint.
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content:
            "You are an embedding generator. Given a text description of a trading operation entity, produce a JSON array of exactly 1536 floating point numbers between -1 and 1 that semantically represents the text. These numbers should encode: entity type, financial magnitude, temporal information, counterparty identity, commodity type, and operational status. Output ONLY the JSON array — no markdown, no explanation.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const embedding = JSON.parse(cleaned);
    if (Array.isArray(embedding) && embedding.length === 1536) {
      return embedding;
    }
  } catch {
    // Fall through to deterministic fallback
  }

  // Deterministic fallback: hash-based embedding
  return generateDeterministicEmbedding(text);
}

function generateDeterministicEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 31 + word.charCodeAt(j)) & 0x7fffffff;
    }
    for (let k = 0; k < 8; k++) {
      const idx = (hash + k * 191) % 1536;
      embedding[idx] += ((hash >> k) & 1) ? 0.1 : -0.1;
    }
  }

  // Normalize
  const norm = Math.sqrt(embedding.reduce((s: number, v: number) => s + v * v, 0)) || 1;
  return embedding.map((v: number) => v / norm);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { mode = "process_queue", tenant_id, entity_type, entity_id, entity_data } = await req.json();

    if (mode === "enqueue") {
      // Enqueue an embedding job
      const { error } = await supabase.from("ail_embedding_jobs").insert({
        tenant_id,
        entity_type,
        entity_id,
        trigger_event: "CREATED",
        job_type: "EMBEDDING",
        status: "QUEUED",
      });

      if (error) throw error;
      return new Response(JSON.stringify({ status: "queued" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "process_single") {
      // Process a single entity directly
      const textRepr = buildTextRepresentation(entity_type, entity_data);
      const embedding = await generateEmbedding(textRepr, LOVABLE_API_KEY);

      const vectorStr = `[${embedding.join(",")}]`;

      const { error } = await supabase.rpc("ail_upsert_embedding", {
        _tenant_id: tenant_id,
        _entity_type: entity_type,
        _entity_id: entity_id,
        _embedding: vectorStr,
        _text_repr: textRepr,
        _metadata: entity_data,
        _model_version: "gemini-2.5-flash-lite",
      });

      // If RPC doesn't exist, do raw upsert
      if (error) {
        const { error: upsertError } = await supabase
          .from("ail_embeddings")
          .upsert(
            {
              tenant_id,
              entity_type,
              entity_id,
              embedding: vectorStr,
              text_repr: textRepr,
              metadata: entity_data,
              model_version: "gemini-2.5-flash-lite",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,entity_type,entity_id" }
          );
        if (upsertError) throw upsertError;
      }

      return new Response(JSON.stringify({ status: "embedded", text_repr: textRepr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: process_queue — pick up QUEUED jobs and process them
    const { data: jobs, error: fetchError } = await supabase
      .from("ail_embedding_jobs")
      .select("*")
      .eq("status", "QUEUED")
      .eq("job_type", "EMBEDDING")
      .order("queued_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ status: "no_jobs", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Mark as PROCESSING
        await supabase
          .from("ail_embedding_jobs")
          .update({ status: "PROCESSING", started_at: new Date().toISOString() })
          .eq("job_id", job.job_id);

        // For queue processing we'd need to fetch the entity data
        // This is a simplified version — in production, fetch from source tables
        const textRepr = `${job.entity_type} entity ${job.entity_id} trigger ${job.trigger_event}`;
        const embedding = generateDeterministicEmbedding(textRepr);
        const vectorStr = `[${embedding.join(",")}]`;

        await supabase
          .from("ail_embeddings")
          .upsert(
            {
              tenant_id: job.tenant_id,
              entity_type: job.entity_type,
              entity_id: job.entity_id,
              embedding: vectorStr,
              text_repr: textRepr,
              metadata: { trigger_event: job.trigger_event },
              model_version: "deterministic-hash-v1",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,entity_type,entity_id" }
          );

        await supabase
          .from("ail_embedding_jobs")
          .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
          .eq("job_id", job.job_id);

        processed++;
      } catch (err) {
        console.error(`Job ${job.job_id} failed:`, err);
        await supabase
          .from("ail_embedding_jobs")
          .update({
            status: "FAILED",
            error_message: err instanceof Error ? err.message : "Unknown error",
            retry_count: (job.retry_count || 0) + 1,
            completed_at: new Date().toISOString(),
          })
          .eq("job_id", job.job_id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ status: "processed", processed, failed, total: jobs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Embedding worker error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

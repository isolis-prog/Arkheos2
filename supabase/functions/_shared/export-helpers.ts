// Shared helpers for export-module-scope edge function.
// SheetJS wrappers, formatters, SHA-256, signed URL helpers.
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./cors.ts";

// Backwards-compatible alias — the original export name was `exportCorsHeaders`.
// New code should import `corsHeaders` directly from `../_shared/cors.ts`.
export const exportCorsHeaders = corsHeaders;

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...exportCorsHeaders, "Content-Type": "application/json" },
  });
}

export function structuredLog(message: string, context: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ message, ...context }));
}

export async function sha256Hex(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed Uint8Array so the type is concretely
  // ArrayBufferView<ArrayBuffer> (not SharedArrayBuffer-backed).
  const source = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const ab = new ArrayBuffer(source.byteLength);
  new Uint8Array(ab).set(source);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function nowIso() {
  return new Date().toISOString();
}

export interface SheetColumnSpec {
  key: string;
  header: string;
  /** number format string, e.g. '#,##0.00' or '0.00%' */
  numFmt?: string;
  width?: number;
}

export interface ExtraSheet {
  name: string;
  columns: SheetColumnSpec[];
  rows: Record<string, unknown>[];
}

export interface BuildXlsxInput {
  contextRows: Array<[string, string]>; // key/value pairs
  narrative?: string | null;
  brandLine?: string;
  summary: { columns: SheetColumnSpec[]; rows: Record<string, unknown>[] };
  detail: { columns: SheetColumnSpec[]; rows: Record<string, unknown>[] };
  /** Sheets inserted between Detail and Audit (e.g., Aging Analysis for cashflows). */
  extraSheets?: ExtraSheet[];
  audit?: { columns: SheetColumnSpec[]; rows: Record<string, unknown>[] };
}

const DEFAULT_BRAND_LINE = "ArkheOS — Scope Export";

function aoaSheetFromKv(rows: Array<[string, string]>, narrative?: string | null, brandLine?: string) {
  const aoa: (string | number | null)[][] = [];
  aoa.push([brandLine ?? DEFAULT_BRAND_LINE]);
  aoa.push([`Generated: ${nowIso()}`]);
  aoa.push([]);
  for (const [k, v] of rows) aoa.push([k, v]);
  if (narrative && narrative.trim().length > 0) {
    aoa.push([]);
    aoa.push(["Analysis"]);
    // split narrative into paragraphs for readability
    for (const para of narrative.split(/\n+/)) aoa.push([para]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 32 }, { wch: 80 }];
  // bold the brand and section headers
  const bold = (addr: string) => {
    if (ws[addr]) ws[addr].s = { font: { bold: true } };
  };
  bold("A1");
  bold("A2");
  if (narrative) {
    const headerRow = aoa.findIndex((r) => r[0] === "Analysis") + 1;
    if (headerRow > 0) bold(`A${headerRow}`);
  }
  return ws;
}

function sheetFromColumnsRows(columns: SheetColumnSpec[], rows: Record<string, unknown>[]) {
  const headers = columns.map((c) => c.header);
  const dataAoa: (string | number | null)[][] = [headers];
  for (const row of rows) {
    dataAoa.push(
      columns.map((c) => {
        const v = row[c.key];
        if (v === undefined || v === null) return null;
        if (v instanceof Date) return v.toISOString();
        if (typeof v === "object") return JSON.stringify(v);
        return v as string | number;
      }),
    );
  }
  const ws = XLSX.utils.aoa_to_sheet(dataAoa);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.min(Math.max(c.header.length + 2, 14), 40) }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  // SheetJS doesn't have a single freeze attribute; use !panes for compatibility
  (ws as unknown as { ["!panes"]: unknown[] })["!panes"] = [
    { ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" },
  ];

  // Bold headers
  for (let c = 0; c < headers.length; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = { font: { bold: true } };
  }

  // Apply number formats
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (!col.numFmt) continue;
    for (let r = 1; r <= rows.length; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: i });
      const cell = ws[addr];
      if (cell && (cell.t === "n" || typeof cell.v === "number")) {
        cell.z = col.numFmt;
      }
    }
  }
  return ws;
}

export function buildXlsxBuffer(input: BuildXlsxInput): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, aoaSheetFromKv(input.contextRows, input.narrative, input.brandLine), "Context");
  XLSX.utils.book_append_sheet(wb, sheetFromColumnsRows(input.summary.columns, input.summary.rows), "Summary");
  XLSX.utils.book_append_sheet(wb, sheetFromColumnsRows(input.detail.columns, input.detail.rows), "Detail");
  for (const extra of input.extraSheets ?? []) {
    XLSX.utils.book_append_sheet(wb, sheetFromColumnsRows(extra.columns, extra.rows), extra.name);
  }
  if (input.audit) {
    XLSX.utils.book_append_sheet(wb, sheetFromColumnsRows(input.audit.columns, input.audit.rows), "Audit");
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  return new Uint8Array(out as ArrayBuffer);
}

/**
 * Build a pivot table (rows=rowKey, cols=colKey, value=valueKey aggregated by sum).
 * Returns columns + rows ready for an ExtraSheet. The first column is the row label.
 */
export function buildPivotSheet(params: {
  rowLabel: string;
  rowKey: string;
  colLabel?: string;
  colKey: string;
  valueKey: string;
  numFmt?: string;
  rows: Record<string, unknown>[];
  /** Optional fixed column ordering (otherwise derived from data). */
  columnOrder?: string[];
  /** Append a Total column at the end. */
  includeRowTotal?: boolean;
}): { columns: SheetColumnSpec[]; rows: Record<string, unknown>[] } {
  const { rowKey, colKey, valueKey, rowLabel, numFmt = "#,##0.00" } = params;
  const colsSet = new Set<string>();
  const grid = new Map<string, Map<string, number>>();
  for (const r of params.rows) {
    const rk = String(r[rowKey] ?? "—");
    const ck = String(r[colKey] ?? "—");
    const v = Number(r[valueKey] ?? 0);
    if (!Number.isFinite(v)) continue;
    colsSet.add(ck);
    if (!grid.has(rk)) grid.set(rk, new Map());
    const inner = grid.get(rk)!;
    inner.set(ck, (inner.get(ck) ?? 0) + v);
  }
  const colOrder = params.columnOrder ?? Array.from(colsSet).sort();
  const columns: SheetColumnSpec[] = [
    { key: "__row", header: rowLabel, width: 32 },
    ...colOrder.map<SheetColumnSpec>((c) => ({ key: c, header: c, numFmt, width: 16 })),
  ];
  if (params.includeRowTotal) columns.push({ key: "__total", header: "Total", numFmt, width: 18 });

  const outRows: Record<string, unknown>[] = [];
  for (const [rk, inner] of grid.entries()) {
    const row: Record<string, unknown> = { __row: rk };
    let total = 0;
    for (const c of colOrder) {
      const v = inner.get(c) ?? 0;
      row[c] = v || null;
      total += v;
    }
    if (params.includeRowTotal) row.__total = total;
    outRows.push(row);
  }
  return { columns, rows: outRows };
}

export function buildCsvBuffer(columns: SheetColumnSpec[], rows: Record<string, unknown>[]): Uint8Array {
  const headers = columns.map((c) => c.header);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c.key])).join(","));
  }
  return new TextEncoder().encode(lines.join("\n"));
}

export async function uploadAndSign(
  supabase: SupabaseClient,
  params: { bucket: string; path: string; body: Uint8Array; contentType: string; ttlSeconds?: number },
): Promise<{ signedUrl: string; expiresAt: string }> {
  const ttl = params.ttlSeconds ?? 86400;
  const { error: upErr } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.body, { contentType: params.contentType, upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const { data, error: signErr } = await supabase.storage.from(params.bucket).createSignedUrl(params.path, ttl);
  if (signErr || !data?.signedUrl) throw new Error(`Sign URL failed: ${signErr?.message ?? "unknown"}`);
  return { signedUrl: data.signedUrl, expiresAt: new Date(Date.now() + ttl * 1000).toISOString() };
}

export function formatPath(parts: { tenantId: string; module: string; runId?: string; scopeKey?: string; correlationId: string; ext: string }): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const key = parts.scopeKey ?? parts.runId ?? "scope";
  return `exports/${parts.tenantId}/${parts.module}/${key}/${parts.correlationId}-${ts}.${parts.ext}`;
}

export function pickScope<T extends Record<string, unknown>>(scope: T) {
  return Object.entries(scope)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as [string, string]);
}

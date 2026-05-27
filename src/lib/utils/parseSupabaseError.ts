/**
 * Extracts a user-friendly message from any error thrown by Supabase
 * (PostgrestError, AuthError, FunctionsHttpError, FunctionsRelayError)
 * or any other unknown error shape.
 *
 * Never returns raw "Failed to fetch" / "TypeError" / "Cannot read
 * property of undefined" — those are mapped to readable equivalents.
 */
export function parseSupabaseError(error: unknown): string {
  if (error == null) return 'Unknown error';
  if (typeof error === 'string') return humanize(error);

  // FunctionsHttpError exposes a .context Response
  const anyErr = error as Record<string, any>;

  // 1. PostgrestError shape: { message, details, hint, code }
  if (anyErr.code && (anyErr.message || anyErr.details)) {
    const code = String(anyErr.code);
    // Common Postgres / PostgREST codes
    if (code === '23505') return 'A record with these values already exists.';
    if (code === '23503') return 'Cannot complete: related record is missing or in use.';
    if (code === '23514') return 'Value violates a database constraint.';
    if (code === '42501' || code === 'PGRST301') return 'You do not have permission to perform this action.';
    if (code === 'PGRST116') return 'No matching record was found.';
    if (code === '22P02') return 'Invalid input format.';
    if (anyErr.message) return humanize(String(anyErr.message));
    if (anyErr.details) return humanize(String(anyErr.details));
  }

  // 2. AuthError: { name: 'AuthApiError' | 'AuthError', status, message }
  if (typeof anyErr.name === 'string' && /Auth/i.test(anyErr.name)) {
    const status = Number(anyErr.status);
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You are not authorized to perform this action.';
    if (anyErr.message) return humanize(String(anyErr.message));
  }

  // 3. FunctionsHttpError / FunctionsRelayError / FunctionsFetchError
  if (typeof anyErr.name === 'string' && /Functions/i.test(anyErr.name)) {
    if (anyErr.context?.statusText) return `Edge function error: ${anyErr.context.statusText}`;
    if (anyErr.message) return humanize(String(anyErr.message));
    return 'Edge function call failed.';
  }

  // 4. HTTP-style: { status, statusText }
  if (typeof anyErr.status === 'number') {
    const s = anyErr.status;
    if (s === 401) return 'Your session has expired. Please sign in again.';
    if (s === 403) return 'You are not authorized to perform this action.';
    if (s === 404) return 'The requested resource was not found.';
    if (s === 409) return 'Conflict: the resource was modified by someone else.';
    if (s === 429) return 'Too many requests. Please slow down and try again.';
    if (s >= 500) return 'A server error occurred. Please try again shortly.';
  }

  // 5. Plain Error
  if (anyErr instanceof Error || typeof anyErr.message === 'string') {
    return humanize(String(anyErr.message));
  }

  try {
    return humanize(JSON.stringify(error));
  } catch {
    return 'An unexpected error occurred.';
  }
}

/**
 * Best-effort guess at HTTP status from an unknown error.
 * Returns null when no status can be inferred.
 */
export function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as Record<string, any>;
  if (typeof e.status === 'number') return e.status;
  if (typeof e.statusCode === 'number') return e.statusCode;
  if (e.context && typeof e.context.status === 'number') return e.context.status;
  // PostgrestError → infer from code
  const code = e.code ? String(e.code) : null;
  if (code === '42501' || code === 'PGRST301') return 403;
  if (code === 'PGRST116') return 404;
  return null;
}

function humanize(raw: string): string {
  if (!raw) return 'An unexpected error occurred.';
  const trimmed = raw.trim();

  // Network noise
  if (/failed to fetch|networkerror|load failed/i.test(trimmed))
    return 'Network error. Check your connection and try again.';
  if (/aborted/i.test(trimmed)) return 'The request was cancelled.';

  // JS runtime noise — never expose to user
  if (/^TypeError:/i.test(trimmed) || /cannot read propert/i.test(trimmed))
    return 'An unexpected error occurred while processing the response.';
  if (/^ReferenceError:/i.test(trimmed))
    return 'An unexpected application error occurred.';

  // Strip "Error: " prefix
  return trimmed.replace(/^Error:\s*/i, '');
}

/**
 * Helpers for propagating drill-down context (`?d=<base64>`) across internal
 * navigation. Keeps breadcrumb continuity intact when the user moves between
 * tabs/pages within a drill flow.
 */

const DRILL_PARAM = 'd';
const LEGACY_DRILL_PARAM = 'drillContext';

/** Read the drill context token from a URLSearchParams or search string. */
export function readDrillContextParam(
  source: URLSearchParams | string | null | undefined,
): string | null {
  if (!source) return null;
  const params =
    typeof source === 'string'
      ? new URLSearchParams(source.startsWith('?') ? source.slice(1) : source)
      : source;
  return params.get(DRILL_PARAM) ?? params.get(LEGACY_DRILL_PARAM);
}

/**
 * Append the drill context token to a target URL/path if present.
 * Preserves any pre-existing query string on the target.
 */
export function withDrillContext(
  target: string,
  drillContextParam: string | null | undefined,
): string {
  if (!drillContextParam) return target;
  const [path, existing = ''] = target.split('?');
  const params = new URLSearchParams(existing);
  // Don't overwrite if target already carries a drill token.
  if (!params.has(DRILL_PARAM) && !params.has(LEGACY_DRILL_PARAM)) {
    params.set(DRILL_PARAM, drillContextParam);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

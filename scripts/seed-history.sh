#!/bin/bash
# ─── History Seed Pack (6-month audit events) ────────────────────────
# Usage:
#   HISTORY_SEED_VOLUME=M HISTORY_SEED_CONFIRM=true ./scripts/seed-history.sh
#   HISTORY_SEED_CONFIRM=true HISTORY_SEED_MODE=clean ./scripts/seed-history.sh
#
# Environment variables:
#   HISTORY_SEED_MODE    - "seed" (default) or "clean"
#   HISTORY_SEED_VOLUME  - S, M (default), or L
#   HISTORY_SEED_MONTHS  - 6 (default), 9, or 12
#   HISTORY_SEED_CONFIRM - must be "true" to execute
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

MODE="${HISTORY_SEED_MODE:-seed}"
VOLUME="${HISTORY_SEED_VOLUME:-M}"
MONTHS="${HISTORY_SEED_MONTHS:-6}"
CONFIRM="${HISTORY_SEED_CONFIRM:-false}"

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set"
  exit 1
fi

if [ "$CONFIRM" != "true" ]; then
  echo "Safety check: set HISTORY_SEED_CONFIRM=true to proceed"
  echo "Example: HISTORY_SEED_VOLUME=$VOLUME HISTORY_SEED_CONFIRM=true ./scripts/seed-history.sh"
  exit 1
fi

echo "╔══════════════════════════════════════════════╗"
echo "║  History Seed Pack (Audit Events)            ║"
echo "║  Mode: $MODE | Volume: $VOLUME | Months: $MONTHS     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/seed-history" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_KEY}" \
  -d "{\"mode\": \"$MODE\", \"size\": \"$VOLUME\", \"months\": $MONTHS, \"confirm\": true}" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Done."

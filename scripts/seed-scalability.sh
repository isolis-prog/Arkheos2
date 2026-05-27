#!/bin/bash
# ─── Scalability Seed Pack ───────────────────────────────────────────
# Usage:
#   SEED_SIZE=L SEED_CONFIRM=true ./scripts/seed-scalability.sh
#   SEED_SIZE=XL SEED_CONFIRM=true SEED_MODE=clean ./scripts/seed-scalability.sh
#
# Environment variables:
#   SEED_MODE    - "seed" (default) or "clean"
#   SEED_SIZE    - S, M, L (default), or XL
#   SEED_CONFIRM - must be "true" to execute
#   SEED_RANDOM  - RNG seed (default: 1337)
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

MODE="${SEED_MODE:-seed}"
SIZE="${SEED_SIZE:-L}"
CONFIRM="${SEED_CONFIRM:-false}"
RANDOM_SEED="${SEED_RANDOM:-1337}"

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
  echo "Safety check: set SEED_CONFIRM=true to proceed"
  echo "Example: SEED_SIZE=$SIZE SEED_CONFIRM=true SEED_MODE=$MODE ./scripts/seed-scalability.sh"
  exit 1
fi

CONFIRM_BOOL=true

echo "╔══════════════════════════════════════════════╗"
echo "║  Scalability Seed Pack                       ║"
echo "║  Mode: $MODE | Size: $SIZE | Seed: $RANDOM_SEED  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/seed-scalability" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_KEY}" \
  -d "{\"mode\": \"$MODE\", \"size\": \"$SIZE\", \"confirm\": $CONFIRM_BOOL, \"seedRandom\": $RANDOM_SEED}" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Done."

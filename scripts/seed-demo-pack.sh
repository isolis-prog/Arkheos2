#!/bin/bash
# ─── Demo Pack Seeder (Happy / Stress / Workflow) ────────────────────
# Usage:
#   DEMO_TENANT_ID=<uuid> DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
#   DEMO_TENANT_ID=<uuid> DEMO_VOLUME=L DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
#   DEMO_TENANT_ID=<uuid> DEMO_MODE=clean DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
#   DEMO_SCENARIOS=happy,stress DEMO_TENANT_ID=<uuid> DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

TENANT="${DEMO_TENANT_ID:-3dde8f40-5bf4-1bbd-3214-b8f4ca780852}"   # default: Meridian Energy Trading
MODE="${DEMO_MODE:-seed}"
VOLUME="${DEMO_VOLUME:-M}"
SCENARIOS="${DEMO_SCENARIOS:-happy,stress,workflow}"
CONFIRM="${DEMO_CONFIRM:-false}"

[ -f .env ] && export $(grep -v '^#' .env | xargs)

URL="${VITE_SUPABASE_URL:-}"
KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then echo "ERROR: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing"; exit 1; fi
if [ "$CONFIRM" != "true" ]; then echo "Safety: set DEMO_CONFIRM=true to proceed"; exit 1; fi

# Convert comma list to JSON array
SC_JSON=$(echo "$SCENARIOS" | awk -F',' '{printf "["; for(i=1;i<=NF;i++){printf "%s\"%s\"", (i>1?",":""), $i}; printf "]"}')

echo "╔══════════════════════════════════════════════╗"
echo "║  Demo Pack Seeder                            ║"
echo "║  Tenant : $TENANT"
echo "║  Mode   : $MODE  Volume: $VOLUME"
echo "║  Scenarios: $SCENARIOS"
echo "╚══════════════════════════════════════════════╝"

curl -s -X POST "${URL}/functions/v1/seed-demo-pack" \
  -H "Authorization: Bearer ${KEY}" -H "apikey: ${KEY}" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"${TENANT}\",\"mode\":\"${MODE}\",\"volume\":\"${VOLUME}\",\"scenarios\":${SC_JSON},\"confirm\":true}" \
  | python3 -m json.tool 2>/dev/null || cat
echo
echo "Done."

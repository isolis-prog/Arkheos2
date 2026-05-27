# Valuation Driver Attribution — v1 Heuristic

## Purpose

The Valuation Reconciliation module compares Front Office (FO) and Middle Office
(MO) valuation snapshots per deal and explains the resulting Profit & Loss
delta. A full quantitative explanation requires a reval engine that can
substitute one input at a time (curve-only reval, vol-only reval, etc.). The
ArkheOS platform does not yet ship that engine, so v1 uses an **auditable,
explainable heuristic** that is good enough to triage breaks and route them to
the right owner.

This document describes exactly how `compute-valuation-deltas` attributes
`total_delta` to the five buckets stored on `valuation_break_details`:

- `curve_delta_usd`
- `vol_delta_usd`
- `fx_delta_usd`
- `model_delta_usd`
- `unexplained_delta_usd`

## Inputs

For each deal we compare the FO and MO `valuation_records` rows:

| Field | Used for |
|---|---|
| `present_value`, `mtm`, `delta_cash` | Per-component delta computation |
| `raw_attributes.theta/vega/rho/gamma/fee/accrual` | Greeks/fees deltas |
| `curve_id` | Curve attribution |
| `vol_surface_id` | Vol attribution |
| `fx_rate_id` | FX attribution |
| `valuation_model` | Model attribution |

## Algorithm

1. **Per-component deltas.** For each of the 9 component types
   (`PV`, `MTM`, `DELTA_CASH`, `THETA`, `VEGA`, `RHO`, `GAMMA`, `FEE`,
   `ACCRUAL`), compute `delta = fo - mo` and `delta_pct = (fo - mo) / fo * 100`.
   Persist a row per component on `valuation_components`. Materiality is
   classified per component using the configurable thresholds (defaults:
   review = 0.5%, material = 2%, critical = 5%).

2. **Total delta.** `total_delta` is the PV component delta. If PV is missing
   we fall back to MTM. The overall break materiality is the highest component
   materiality, with PV taking precedence when tied.

3. **Primary driver.** The component with the largest absolute delta becomes
   `primary_driver_component`. This is the field that drives the L4 strategy
   donut in the UI.

4. **Driver attribution (the heuristic).** Compare the four input identifiers
   between FO and MO:

   ```
   curveDiffers = fo.curve_id != mo.curve_id
   volDiffers   = fo.vol_surface_id != mo.vol_surface_id
   fxDiffers    = fo.fx_rate_id != mo.fx_rate_id
   modelDiffers = fo.valuation_model != mo.valuation_model
   ```

   Let `n` be the number of differing inputs. The driver buckets are then
   filled by **equal-weight split**:

   ```
   share        = total_delta / n   (or 0 if n == 0)
   curve_delta  = curveDiffers ? share : 0
   vol_delta    = volDiffers   ? share : 0
   fx_delta     = fxDiffers    ? share : 0
   model_delta  = modelDiffers ? share : 0
   unexplained  = total_delta - (curve + vol + fx + model)
   ```

   When `n == 0` the entire delta lands in `unexplained_delta_usd` and the AI
   layer is asked to suggest a root cause from context (typical: stale data,
   trade capture mismatch, intra-day amendment).

## Why equal-weight split

The accounting requirement is: every USD of delta is reported in *one* of the
attribution buckets so the totals reconcile to `total_delta` exactly. An
equal-weight split is the most defensible non-quantitative allocation when the
platform cannot run a per-factor reval. It biases nothing, it is fully
auditable, and the unexplained residual is always 0 when at least one input
differs (so reviewers always see *which* inputs differed rather than seeing a
black-box residual).

## Known limitations

- The split is **not** the true factor decomposition. Two breaks with the same
  total delta and the same `n=2` differing inputs will get identical
  per-bucket numbers even if, in reality, one was 90% curve / 10% vol and the
  other was 10% curve / 90% vol.
- `model_delta` is triggered by any string difference in `valuation_model`.
  Cosmetic differences (e.g. `Black76` vs `BLACK_76`) will be counted as a
  model break. Normalise model names upstream.
- Greeks deltas (`THETA`, `VEGA`, `RHO`, `GAMMA`) are read from
  `raw_attributes` JSON. If a source system does not populate those fields we
  silently skip the component rather than reporting a false break.
- The materiality classification is purely percentage-based. A
  $50,000 break on a $1B notional will be `immaterial` (0.005%) by default.
  Tenants that need absolute thresholds should override
  `materialityThresholds` per run.

## Roadmap toward v2

When the structured pricing module ships a reval engine that can revalue a
deal with a single input swapped:

1. Replace the equal-weight split with sequential single-factor reval
   (curve-then-vol-then-fx-then-model), capturing the marginal PV impact at
   each step.
2. Set `unexplained_delta_usd = total_delta - sum(marginal_impacts)` so the
   residual reflects genuine unexplained movement (e.g. position changes
   between snapshots).
3. Keep this v1 heuristic available as a fallback for products the reval
   engine does not yet cover.

# Confirmation Documents — Ingestion Adapter Contract

This document defines the expected `parsed_attributes` JSONB shape that
upstream ingestion workers (PDF parsers, FpML/SWIFT consumers, email
processors, manual entry forms, ETRM trade-capture publishers) MUST produce
when inserting rows into `public.confirmation_documents`.

The matching engine (`supabase/functions/match-confirmations`) compares the
`parsed_attributes` of the `our_capture` document against the
`counterparty_confirm` document field by field, using rules defined in
`public.confirmation_field_rules`. **Any field name your adapter emits MUST
match the `field_name` registered in `confirmation_field_rules` for the
tenant**, otherwise the field will be ignored at match time.

---

## Common rules

- All keys are `snake_case`.
- Dates are ISO 8601 `YYYY-MM-DD`. Datetimes are ISO 8601 with timezone.
- Numbers are plain JSON numbers (not strings). Use full precision; the
  matching engine applies tolerances.
- Currencies are uppercase ISO 4217 (`USD`, `EUR`, `GBP`).
- Day count and business day conventions SHOULD use canonical short forms
  (e.g. `ACT/360`, `30/360`, `MODIFIED_FOLLOWING`). The engine's
  `normalized` match type will collapse common variants (`Actual/360` →
  `ACT360`) so equivalent values won't raise material discrepancies.
- Unknown / not-applicable fields MUST be omitted (do not emit `null`).

---

## doc_type = `our_capture`

Source: internal trading system (ETRM trade capture publisher).

Required keys depend on the asset class. The matching engine only compares
fields that are present in BOTH `our_capture` and `counterparty_confirm`.

### Interest Rate Swap (`product_code: IRS_*`)

```json
{
  "notional": 10000000,
  "notional_currency": "USD",
  "currency": "USD",
  "fixed_rate": 0.0425,
  "floating_spread": 0.0,
  "floating_index": "SOFR",
  "effective_date": "2026-05-01",
  "termination_date": "2031-05-01",
  "payment_frequency": "QUARTERLY",
  "day_count": "ACT/360",
  "business_day_convention": "MODIFIED_FOLLOWING",
  "settlement_type": "CASH"
}
```

### FX Forward (`product_code: FX_FWD`)

```json
{
  "notional": 5000000,
  "notional_currency": "EUR",
  "currency": "EUR",
  "price": 1.0925,
  "effective_date": "2026-04-25",
  "termination_date": "2026-07-25",
  "settlement_type": "DELIVERY"
}
```

### Commodity Future (`product_code: OIL_FUT`, `GAS_SWAP`, `POWER_OPT`)

```json
{
  "notional": 1000000,
  "currency": "USD",
  "price": 78.50,
  "effective_date": "2026-04-25",
  "termination_date": "2026-12-31",
  "settlement_type": "CASH"
}
```

---

## doc_type = `counterparty_confirm`

Source: counterparty portal, FpML/SWIFT MT message, parsed PDF, broker
confirmation. Same JSON shape as `our_capture`. The ingestion adapter
SHOULD set `parsing_confidence` (0–1) on the row and `parsing_status`
(`pending`, `parsed`, `parse_failed`, `manual_review`).

If a field could not be reliably extracted, OMIT it. The matching engine
will then raise a `missing_their_side` discrepancy if `our_capture`
contains the field — which is correct behavior.

---

## doc_type = `broker_confirm`, `electronic_message`

Same JSON shape as `counterparty_confirm`. The matching engine treats them
as alternative sources of the counterparty side.

---

## doc_type = `amendment`

Adds an `amendment` envelope describing what changed:

```json
{
  "amendment_of_doc_id": "<uuid of original confirmation_doc>",
  "amendment_reason": "RATE_RESET | NOTIONAL_INCREASE | TERM_EXTENSION | OTHER",
  "amendment_effective_date": "2026-06-01",
  "fields_changed": ["fixed_rate", "termination_date"],
  "fixed_rate": 0.0450,
  "termination_date": "2032-05-01"
}
```

The matching engine does NOT auto-apply amendments — operations users must
explicitly create a new pairing run after an amendment.

---

## doc_type = `termination`

```json
{
  "terminates_doc_id": "<uuid of original confirmation_doc>",
  "termination_reason": "EARLY_TERMINATION | NOVATION | DEFAULT | EXPIRY",
  "termination_effective_date": "2026-08-15",
  "termination_payment": 125000.00,
  "termination_currency": "USD"
}
```

---

## Pairing keys

The matching engine pairs documents by:
`(counterparty_id, trade_date, product_code)`

Adapters MUST populate the relational columns on `confirmation_documents`
(`counterparty_id`, `legal_entity_id`, `trade_date`, `product_code`,
`notional`, `currency`) so pairing works even before `parsed_attributes`
is fully extracted.

---

## Error / failure handling

- Set `parsing_status = 'parse_failed'` and `parsing_confidence` low
  (≤ 0.3) when extraction fails. The matching engine will skip fields
  that are missing.
- Set `parsing_status = 'manual_review'` to surface the doc to the
  operations queue for human enrichment before the next run.
- `raw_payload_hash` SHOULD be a SHA-256 of the original payload to
  enable idempotent re-ingestion.
- `storage_path` SHOULD point at the original artifact in object storage
  (PDF, FpML XML, MT message body) for audit and re-parsing.

---

## Versioning

This contract is versioned implicitly by the rules registered in
`confirmation_field_rules`. To introduce a new field, add a rule first,
then update adapters to emit it. The matching engine only compares fields
for which an active rule exists.

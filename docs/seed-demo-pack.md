# Demo Pack Seeder — Guía rápida

End-to-end seed dataset que cubre tres escenarios para demos de robustez de **ArkheOS**.

## Cómo ejecutar

```bash
# Default: tenant Meridian, volumen M, los 3 escenarios
DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh

# Limpieza completa (sólo borra rows marcados con __demo_pack)
DEMO_MODE=clean DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh

# Volumen grande para probar paginación / performance
DEMO_VOLUME=L DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh

# Sólo un escenario
DEMO_SCENARIOS=stress DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
```

Cada fila sembrada lleva `attributes->>'__demo_pack' = true` o el prefijo
`DEMO-` en su `*_ref`, así el modo `clean` puede revertir todo sin tocar
datos reales.

| Volumen | Trades | Invoices | Cashflows | Recon runs | Confirmations |
|---------|--------|----------|-----------|------------|---------------|
| **S**   | 60     | 50       | 120       | 6          | 40            |
| **M**   | 200    | 160      | 400       | 12         | 100           |
| **L**   | 600    | 480      | 1 200     | 24         | 250           |

---

## Escenario 1 · Happy Path

Pobla todos los módulos respetando dependencias FK:

```
canonical_counterparties → canonical_products → canonical_trades
                                              → canonical_invoices (FK trade_id)
                                              → cashflow_event (reference = trade_ref)
reconciliation_templates → reconciliation_runs (con metrics realistas)
```

* Variedad de status, monedas, productos y fechas → KPIs y gráficas con
  tendencias coherentes.
* Notional coherente (`quantity × price`) almacenado en `attributes.notional`
  para validar cálculos de PV.

## Escenario 2 · Stress Test (la “historia de error”)

10 inserciones diseñadas para probar que el sistema **detecta y bloquea**.
La función devuelve un array `sections.stress.stories` describiendo qué
ocurrió con cada una. Esto es lo que mostrarás en el demo:

| # | Caso borde                                      | Defensa esperada                          |
|---|-------------------------------------------------|-------------------------------------------|
| 1 | `trade_ref` duplicado en dos inserts            | App-level uniqueness (no UNIQUE en DB)    |
| 2 | `quantity` y `price` negativos                  | Regla de negocio en formularios           |
| 3 | Fecha imposible `2024-02-30`                    | **Postgres REJECTS** (date type)          |
| 4 | Payload XSS / SQLi en `trade_ref`               | Almacenado seguro vía parametrized SQL    |
| 5 | Outliers `1e9` y `0.0001`                       | Charts manejan rango (test visual)        |
| 6 | Invoice con `trade_id` inexistente              | **FK REJECTS** (`canonical_invoices_trade_id_fkey`) |
| 7 | Invoice con `trade_id = NULL`                   | Aceptado → aparece como “unmatched”       |
| 8 | `cashflow_event.confidence_score = 250`         | **CHECK REJECTS** (`0..100`)              |
| 9 | `cashflow_event.direction = 'SIDEWAYS'`         | **ENUM REJECTS** (`cashflow_direction`)   |
|10 | `tenant_id` inexistente                         | **FK REJECTS** (tenant isolation)         |

Cada `story` queda anotada en `attributes.story` para que puedas
filtrarlas en la UI y mostrar la trazabilidad: `WHERE attributes->>'story' = 'duplicate_ref_first'`.

## Escenario 3 · Workflow

Genera N filas en `trade_confirmation_status` con stages variados
(`matched / awaiting_counterparty / awaiting_us / disputed / amended`)
y `sla_breach_at` para alimentar las KPI cards y la cola del Inbox.

---

## Borrado seguro

```bash
DEMO_MODE=clean DEMO_CONFIRM=true ./scripts/seed-demo-pack.sh
```

Borra en orden inverso de FK (children → parents). Sólo afecta filas
marcadas con `__demo_pack` o prefijo `DEMO-`.

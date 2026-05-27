# Forensic Drill-Down Schema

Este documento describe la extensión de esquema creada para soportar navegación forense desde agregados de conciliación hasta líneas individuales de trade/documento, sin modificar las tablas base existentes del dominio de reconciliación.

## Objetivo funcional

La extensión añade una capa especializada para:

- modelar el detalle forense de cada `exception_case`
- enlazar documentos con deals/trades para navegación documental → económica
- auditar recorridos de drill-down del usuario
- exponer agregados precalculados por nivel de navegación sin acceso directo a vistas materializadas

La jerarquía de profundidad objetivo queda soportada por:

1. run de conciliación
2. categoría de break
3. entidad legal
4. contraparte externa
5. documento
6. deal / trade enlazado
7. línea o detalle final derivado del documento/caso

---

## Tablas nuevas

## 1) `break_details`

**Propósito:** representa el detalle forense enriquecido de un `exception_case` dentro de un `reconciliation_run`, con métricas derivadas para navegación, priorización y agregación.

### Responsabilidad

- fijar una relación 1:1 entre `exception_cases` y detalle forense enriquecido
- concentrar atributos necesarios para drill-down analítico sin contaminar tablas operativas existentes
- servir como tabla base para las cuatro materialized views de agregación

### Columnas clave

- `break_detail_id`: identificador técnico del detalle
- `tenant_id`: partición de tenant y base de RLS
- `exception_case_id`: referencia única al caso; fuerza cardinalidad 1:1
- `run_id`: referencia al run de conciliación que originó el break
- `legal_entity_id`: entidad legal atribuida al break
- `external_counterparty_id`: contraparte externa atribuida
- `doc_id`: identificador documental de navegación
- `doc_type`: taxonomía documental controlada
- `side_a_amount`, `side_b_amount`: importes origen por cada lado
- `amount_delta`: diferencia absoluta derivada y persistida
- `amount_delta_pct`: diferencia relativa persistida
- `side_a_date`, `side_b_date`: fechas comparadas
- `date_delta_days`: diferencia de días persistida
- `currency`: moneda operativa del break
- `break_category`: clasificación de navegación y agregado
- `suggested_root_cause`: hipótesis explicativa
- `ai_confidence`: confianza del enriquecimiento automatizado

### Reglas implícitas de negocio

- cada `exception_case` puede tener **un solo** `break_details`
- el cálculo de `amount_delta` es: `coalesce(side_a_amount, 0) - coalesce(side_b_amount, 0)`
- `amount_delta_pct` usa `side_a_amount` como base y evita división por cero con `nullif`
- `date_delta_days` compara la mejor fecha disponible entre ambos lados
- el registro está preparado tanto para breaks documentales como breaks de presencia/ausencia (`missing_in_a`, `missing_in_b`)

### ER-style inline comments

```text
tenants (1) ────────< break_details >──────── (1) exception_cases
   │                         │                         │
   │                         └───────────────> reconciliation_runs (N:1)
   │
   ├───────────────> canonical_counterparties (legal_entity_id)
   └───────────────> canonical_counterparties (external_counterparty_id)

break_details = nodo forense central para agregados y navegación documental
```

---

## 2) `document_trade_links`

**Propósito:** materializa la relación entre un documento reconciliado y uno o más deals/trades para soportar trazabilidad documental → económica.

### Responsabilidad

- resolver el salto entre `doc_id/doc_type` y `deal_id`
- capturar allocation monetaria o porcentual por trade
- diferenciar si el vínculo proviene del sistema, inferencia AI, intervención manual o migración

### Columnas clave

- `link_id`: identificador técnico
- `tenant_id`: aislamiento multi-tenant
- `doc_id`, `doc_type`: clave documental de origen
- `deal_id`: identificador de trade/deal enlazado
- `allocation_amount`: porción monetaria asociada al deal
- `allocation_pct`: participación porcentual del deal dentro del documento
- `link_source`: procedencia del vínculo
- `ai_confidence`: confianza del match inferido
- `created_by`: usuario que originó el vínculo cuando aplica

### Reglas implícitas de negocio

- la combinación `(tenant_id, doc_id, doc_type, deal_id)` es única
- un documento puede enlazar a múltiples deals
- un deal puede aparecer en múltiples documentos
- la tabla no impone por sí sola suma 100% de allocations; esa validación puede vivir en servicio/aplicación posterior

### ER-style inline comments

```text
tenants (1) ────────< document_trade_links >──────── profiles (created_by)
   │
   └──── document key (doc_id, doc_type) ────> enlaza con break_details.doc_id/doc_type

document_trade_links = puente M:N entre documentos reconciliados y deals
```

---

## 3) `drill_audit_events`

**Propósito:** auditar la navegación analítica del usuario a través de los distintos niveles del drill-down.

### Responsabilidad

- registrar qué módulo originó el evento
- registrar el tipo de interacción (`navigate`, `expand_row`, `open_panel`, etc.)
- persistir la ruta de navegación (`drill_path`) y filtros (`scope_filters`)
- capturar a qué nivel llegó el usuario y sobre cuántas filas operó

### Columnas clave

- `drill_event_id`: identificador técnico
- `tenant_id`: ámbito del evento
- `user_id`: actor autenticado
- `module`: módulo funcional que emite el evento
- `action`: acción concreta del usuario
- `drill_path`: payload JSONB con breadcrumb o ruta estructurada
- `scope_filters`: filtros activos al momento del evento
- `target_level`: profundidad alcanzada, de 0 a 7
- `row_count`: cantidad de filas visibles/impactadas

### Reglas implícitas de negocio

- para usuarios normales del tenant es un log **append-only**
- no existe política de `UPDATE` ni `DELETE` para usuarios regulares
- `user_id` debe coincidir con `auth.uid()` en inserción

### ER-style inline comments

```text
tenants (1) ────────< drill_audit_events >──────── profiles (user_id)

drill_audit_events = bitácora de observabilidad de uso, no tabla operativa de reconciliación
```

---

## Índices creados

Los índices siguen el patrón de acceso esperado por el drill-down:

### `break_details`

- `(tenant_id, run_id, break_category, legal_entity_id)`
  - acelera nivel run → categoría → entidad
- `(tenant_id, run_id, external_counterparty_id)`
  - acelera saltos por contraparte dentro del run
- `(tenant_id, doc_id)`
  - acelera apertura documental directa

### `document_trade_links`

- `(tenant_id, doc_id)`
  - resuelve documento → deals
- `(tenant_id, deal_id)`
  - resuelve trade → documentos

### `drill_audit_events`

- `(tenant_id, user_id, created_at desc)`
  - timeline analítica por usuario
- `(tenant_id, module, target_level)`
  - análisis de adopción por módulo y profundidad

---

## Materialized Views nuevas

Las cuatro MVs se construyen sobre `break_details` y, en el caso documental, complementan con `exception_cases` y `document_trade_links`.

> Importante: no se conceden permisos directos de lectura a las MVs. La exposición se hace mediante funciones SQL `SECURITY INVOKER` filtradas por tenant.

## 1) `mv_recon_run_by_break_type`

**Grano:** `(tenant_id, run_id, break_category)`

### Uso

- primer nivel agregado por run
- tablero de distribución de breaks por categoría
- baseline para heatmaps y priorización

### Métricas

- `break_count`
- `total_exposure_usd`
- `min_amount_delta`
- `max_amount_delta`
- `avg_age_days`

### ER-style inline comments

```text
break_details ──aggregate──> mv_recon_run_by_break_type
grain = 1 fila por tenant + run + categoría
```

---

## 2) `mv_recon_run_by_entity`

**Grano:** `(tenant_id, run_id, legal_entity_id, break_category)`

### Uso

- drill de categoría hacia entidad legal
- identificación de dónde se concentra la exposición
- ranking de contraparte top asociada por bucket

### Métricas/atributos

- `legal_entity_name`
- `break_count`
- `total_exposure_usd`
- `top_counterparty_id`

### Lógica relevante

- `top_counterparty_id` se obtiene con un ranking previo sobre frecuencia de breaks por contraparte
- se usa una CTE intermedia para evitar agregaciones inválidas sobre UUID

### ER-style inline comments

```text
break_details + canonical_counterparties(legal entity)
   └─aggregate by legal entity/category─> mv_recon_run_by_entity

top_counterparty_id = contraparte más frecuente dentro del bucket agregado
```

---

## 3) `mv_recon_run_by_counterparty`

**Grano:** `(tenant_id, run_id, legal_entity_id, external_counterparty_id, break_category)`

### Uso

- drill entidad → contraparte
- cuantificación de exposición por relación comercial
- identificación de breaks envejecidos y volumen documental abierto

### Métricas/atributos

- `counterparty_name`
- `break_count`
- `total_exposure_usd`
- `oldest_break_age_days`
- `open_doc_count`

### ER-style inline comments

```text
break_details + canonical_counterparties(counterparty)
   └─aggregate by entity/counterparty/category─> mv_recon_run_by_counterparty
```

---

## 4) `mv_recon_run_by_document`

**Grano:** `(tenant_id, run_id, doc_id)`

### Uso

- drill contraparte → documento
- análisis consolidado por documento aunque existan múltiples `break_details`
- puente a `document_trade_links` para contar deals enlazados

### Métricas/atributos

- `doc_type`
- `legal_entity_id`
- `external_counterparty_id`
- `side_a_amount`
- `side_b_amount`
- `amount_delta`
- `amount_delta_pct`
- `currency`
- `break_category`
- `status`
- `trade_count`

### Lógica relevante

- realiza una fase `doc_rollup` para consolidar importes y claves del documento
- separa `doc_status` para consolidar el estado de `exception_cases`
- separa `doc_trades` para contar `deal_id` distintos enlazados
- selecciona una única entidad/contraparte representativa mediante `array_agg(... order by ...)[1]` evitando agregadores inválidos sobre UUID

### ER-style inline comments

```text
break_details
   + exception_cases(status)
   + document_trade_links(trade_count)
      └─aggregate by document─> mv_recon_run_by_document

mv_recon_run_by_document = vista bisagra entre evidencia documental y detalle económico
```

---

## Funciones expuestas

## Funciones de lectura por tenant

Se crearon estas funciones `SECURITY INVOKER`:

- `get_mv_recon_run_by_break_type(_run_id uuid default null)`
- `get_mv_recon_run_by_entity(_run_id uuid default null)`
- `get_mv_recon_run_by_counterparty(_run_id uuid default null)`
- `get_mv_recon_run_by_document(_run_id uuid default null)`

### Comportamiento

- no hacen bypass de tenant
- filtran siempre por `tenant_id = public.get_user_tenant_id(auth.uid())`
- opcionalmente acotan por `run_id`
- evitan conceder `SELECT` directo sobre materialized views

## Función de refresh

- `refresh_drill_mvs(p_run_id uuid)`

### Comportamiento

- valida que `p_run_id` no sea nulo
- valida existencia del `reconciliation_run`
- refresca las cuatro MVs en serie

### Nota de diseño

El refresh quedó **no concurrente** por restricción de PostgreSQL para encapsular esta operación en una función invocable desde backend functions. Para workloads más altos, el siguiente paso recomendado es extraer el refresh a un workflow externo que emita `REFRESH MATERIALIZED VIEW CONCURRENTLY` por vista de forma controlada.

---

## RLS y aislamiento multi-tenant

## Principios aplicados

- sin `USING (true)` en las nuevas políticas
- sin tenant UUID hardcodeado
- todo aislamiento resuelve tenant dinámicamente con `public.get_user_tenant_id(auth.uid())`

## `break_details`

- **lectura:** solo filas del tenant activo
- **creación/edición:** mismo tenant y rol en `admin | reconciliation_analyst | controller`

## `document_trade_links`

- **lectura:** solo filas del tenant activo
- **creación/edición:** mismo tenant y rol en `admin | reconciliation_analyst | controller`

## `drill_audit_events`

- **lectura:** solo filas del tenant activo
- **creación:** mismo tenant y `user_id = auth.uid()`
- **sin update/delete** para usuarios regulares

## Compatibilidad con roles existentes

Para satisfacer el requerimiento exacto de permisos, el enum `public.app_role` se amplió con:

- `admin`
- `reconciliation_analyst`
- `controller`

Además, se añadió una sobrecarga de `public.has_role(_user_id uuid, _role text)` para permitir validación por nombre textual sin depender del enum en tiempo de definición de políticas.

---

## Flujo de datos soportado

```text
reconciliation_runs
  └─ exception_cases
      └─ break_details
          ├─ aggregate → mv_recon_run_by_break_type
          ├─ aggregate → mv_recon_run_by_entity
          ├─ aggregate → mv_recon_run_by_counterparty
          └─ aggregate → mv_recon_run_by_document
                                └─ joins → document_trade_links

UI / services
  └─ call SQL functions get_mv_* filtered by auth tenant

Telemetry / observability
  └─ insert drill_audit_events
```

---

## Archivo de migración asociado

La extensión quedó materializada en la migración más reciente bajo `supabase/migrations`.

---

## Riesgos / follow-ups recomendados

1. **Refresh concurrente futuro**
   - si el volumen crece por encima de decenas de miles de breaks por run, conviene desacoplar el refresh a un job externo con `CONCURRENTLY`.

2. **Validación de allocations**
   - `document_trade_links` permite múltiples asignaciones; si el negocio exige cierre exacto a 100%, conviene agregar validación a nivel servicio o función transaccional.

3. **Moneda base / FX normalizado**
   - `total_exposure_usd` hoy usa `amount_delta` como exposición nominal agregada. Si el dominio requiere conversión estricta a USD, se debería incorporar join con FX rate snapshot del run.

4. **Capa API / hooks**
   - la base ya está preparada para una futura capa de hooks React Query que consuma `get_mv_*` y un endpoint/función para `refresh_drill_mvs`.

5. **Benchmark real**
   - el requisito de refresh `< 5s` debe validarse con seed específica de `10,000 exception_cases` y medición real en backend function o SQL timing controlado.
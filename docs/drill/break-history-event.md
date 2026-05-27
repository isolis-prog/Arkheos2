# BreakHistoryEvent — Guía de tipado

Esta guía documenta el contrato del tipo `BreakHistoryEvent` usado por el módulo
de drill-down (timeline de breaks). Su objetivo es mantener un tipado
**consistente y estricto** en todo el equipo: el campo `type` debe ser siempre
una de las literales del union, nunca un `string` genérico.

---

## 1. Definición canónica

Origen: [`src/components/drill/types.ts`](../../src/components/drill/types.ts)

```ts
export interface BreakHistoryEvent {
  id: string;
  type: 'comment' | 'status_change';
  label: string;
  description?: string;
  createdAt: string; // ISO 8601
  actor?: string;
}
```

### Reglas

| Campo         | Tipo                                | Obligatorio | Notas |
|---------------|-------------------------------------|-------------|-------|
| `id`          | `string`                            | ✅          | Único dentro del timeline. Convención: `<type>-<entityId>`, p. ej. `comment-42`, `status-7af3...`. |
| `type`        | `'comment' \| 'status_change'`      | ✅          | **Union literal exacta**. No usar `string` ni añadir literales nuevos sin actualizar el tipo. |
| `label`       | `string`                            | ✅          | Título corto que se muestra en el timeline. |
| `description` | `string`                            | ❌          | Detalle largo opcional (cuerpo del comentario, resumen del cambio). |
| `createdAt`   | `string` (ISO 8601)                 | ✅          | Se usa para ordenar el timeline (DESC por defecto). |
| `actor`       | `string`                            | ❌          | Nombre o email del usuario/sistema que generó el evento. |

---

## 2. Ejemplos por `type`

### 2.1 `'comment'` — Comentario añadido a una excepción

```ts
const commentEvent: BreakHistoryEvent = {
  id: 'comment-42',
  type: 'comment',
  label: 'Comment added',
  description: 'Counterparty confirmó el ajuste por SMS, pendiente de PDF.',
  createdAt: '2025-04-22T09:14:00.000Z',
  actor: 'maria.lopez@arkheos.com',
};
```

### 2.2 `'status_change'` — Cambio de estado del caso

```ts
const statusEvent: BreakHistoryEvent = {
  id: 'status-7af3c1',
  type: 'status_change',
  label: 'Status: in review',
  description: 'Esperando validación de Middle Office.',
  createdAt: '2025-04-22T10:02:11.000Z',
  actor: 'system',
};
```

### 2.3 `'status_change'` — Linkage de trade detectada

> Reutilizamos `'status_change'` cuando el cambio proviene de un linkage
> automático documento ↔ trade. Si en el futuro este caso necesita ser
> diferenciado, **primero** se debe ampliar el union en `types.ts` y luego
> actualizar el zod schema y los tests.

```ts
const linkageEvent: BreakHistoryEvent = {
  id: 'trade-link-991',
  type: 'status_change',
  label: 'Linked trade TRD-2025-0042',
  description: 'matched',
  createdAt: '2025-04-22T08:00:00.000Z',
  actor: 'Document linkage',
};
```

---

## 3. Helpers oficiales

Origen: [`src/lib/drill/breakHistory.ts`](../../src/lib/drill/breakHistory.ts)

### 3.1 `makeBreakHistoryEvent`

Construye un evento individual preservando el literal de `type` sin necesidad
de `as const`.

```ts
import { makeBreakHistoryEvent } from '@/lib/drill/breakHistory';

const evt = makeBreakHistoryEvent({
  id: 'comment-1',
  type: 'comment', // inferido como 'comment', NO como string
  label: 'Comment added',
  createdAt: new Date().toISOString(),
});
```

### 3.2 `buildBreakHistory`

Construye y valida un timeline completo. Cada entrada se valida con **zod**;
las entradas cuyo `type` no sea `'comment'` ni `'status_change'` son rechazadas
en runtime.

```ts
import { buildBreakHistory } from '@/lib/drill/breakHistory';

const history = buildBreakHistory(
  [
    { id: 'status-1', type: 'status_change', label: 'Status: open', createdAt: '2025-04-22T08:00:00Z' },
    { id: 'comment-1', type: 'comment', label: 'Comment added', description: 'Revisar', createdAt: '2025-04-22T09:00:00Z' },
  ],
  { sort: 'desc', onInvalid: 'skip' }, // valores por defecto
);
```

#### Opciones

| Opción       | Valores                       | Default  | Descripción |
|--------------|-------------------------------|----------|-------------|
| `sort`       | `'asc' \| 'desc' \| 'none'`   | `'desc'` | Orden por `createdAt`. |
| `onInvalid`  | `'skip' \| 'throw'`           | `'skip'` | `skip` filtra entradas inválidas y emite `console.warn`. `throw` lanza `ZodError`. |

### 3.3 Schemas zod expuestos

```ts
import {
  breakHistoryEventTypeSchema, // z.enum(['comment', 'status_change'])
  breakHistoryEventSchema,
  breakHistoryEventArraySchema,
} from '@/lib/drill/breakHistory';
```

Úsalos cuando recibas un payload **no confiable** (API externa, webhook, JSON
del usuario) y necesites validarlo antes de pasarlo al UI.

---

## 4. Antipatrones (❌ no hacer)

```ts
// ❌ Castear el tipo a string
const evt = { id: '1', type: 'comment' as string, label: 'x', createdAt: '...' };

// ❌ Usar `as const` esparcido por todo el código
events.map((c) => ({ ...c, type: 'comment' as const }));

// ❌ Inventar literales nuevos sin actualizar el union
{ type: 'amendment', ... } // ¡rechazado en compile-time y runtime!

// ❌ Ordenar manualmente fuera del helper (duplica lógica)
list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
```

---

## 5. Cómo extender el union

Si necesitas añadir un nuevo tipo de evento (p. ej. `'amendment'`):

1. Actualiza el union en `src/components/drill/types.ts`.
2. Añade el literal a `breakHistoryEventTypeSchema` en `src/lib/drill/breakHistory.ts`.
3. Añade un caso al test de tipos en
   `src/hooks/__tests__/useBreakDetail.types.test.ts`.
4. Documenta el nuevo literal en la sección **2. Ejemplos por `type`** de este
   archivo, incluyendo un ejemplo realista.

---

## 6. Tests de garantía

- **Tipo**: `src/hooks/__tests__/useBreakDetail.types.test.ts` verifica con
  `expectTypeOf` que `BreakHistoryEvent['type']` es exactamente
  `'comment' | 'status_change'` (y **no** `string`).
- **Runtime**: el mismo archivo cubre que `buildBreakHistory` filtra entradas
  con `type` inválido cuando `onInvalid: 'skip'`.

Mantener estos tests verdes es la garantía de que el contrato no se degrada.

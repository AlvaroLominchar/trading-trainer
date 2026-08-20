# Trading Trainer

Nombre técnico provisional de una plataforma SaaS para entrenar toma de decisiones de trading mediante escenarios sintéticos o históricos controlados.

> Producto en desarrollo. No ofrece señales, recomendaciones de inversión, ejecución de operaciones ni promesas de rentabilidad.

## Concepto

Trading Trainer funciona como un **gimnasio de decisiones**:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

El objetivo no es reproducir un terminal completo, sino convertir aprendizaje pasivo en práctica corta, visual y medible.

## Estado confirmado

Último commit confirmado:

```text
1335056 Add procedural difficulty
```

Ya existen:

- Supabase + Google OAuth;
- navegación privada;
- entrenamiento jugable;
- gráfico con futuro oculto;
- `largo | corto | no operar`, con acción temporal `Esperar`;
- confianza;
- Entrada/Stop/Objetivo;
- Lectura, Plan y Gestión deterministas e independientes;
- gestión progresiva;
- persistencia segura server-side;
- historial;
- perfil de habilidades;
- dashboard real y pulido;
- motor procedural con seeds reproducibles;
- selector que reduce repetición;
- dificultad procedural explícita y visible.

Git y el `PROJECT_SNAPSHOT_<commit>.txt` más reciente gobiernan el estado exacto.

## Principios

- Proceso antes que resultado.
- `No operar` puede ser la mejor respuesta.
- Sin nota global oficial de trader.
- La confianza no altera el score individual.
- El futuro no modifica retroactivamente la decisión.
- Scoring explicable, determinista, versionado y testeable.
- IA como capa explicativa futura, no como verdad del ejercicio.
- Sin señales/recomendaciones sobre mercado actual en esta fase.

## Motor procedural

Archivo:

```text
src/features/training/exercises/synthetic-catalog.ts
```

Identidad:

```text
arquetipo + seed + versión
```

Ejemplo:

```text
syn-range-midpoint-g2-s4242
```

La misma seed reconstruye el mismo escenario también en servidor.

`g1` queda únicamente como compatibilidad para tres familias legacy; nuevos ejercicios usan `g2`.

V2 genera estructura de mercado primero y OHLCV después. Varía estructura, dirección, timeframe, duración, microestructura, volatilidad, shocks, wicks, volumen, precio base y timestamps.

Existe un validador automático y tests de diversidad geométrica. El espacio de seeds llega hasta `999_999_999` por arquetipo. Las comprobaciones de 60.000 o 20.000 escenarios mencionadas durante el desarrollo fueron muestras de QA, no un catálogo materializado ni una promesa de que todas las seeds posibles estén validadas.

## Catálogo pedagógico — Bloque 13

El Bloque 13 amplía el catálogo de 3 a **8 familias**:

```text
trend-continuation
range-midpoint
false-breakout
breakout-acceptance
range-extreme
compression
exhaustion-reversal
level-retest
```

Nuevos conceptos:

- ruptura con aceptación;
- rechazo en extremo de rango;
- compresión de volatilidad;
- agotamiento/reversión;
- retest de nivel.

Cada familia nueva tiene seis variantes estructurales deterministas por seed.

El Bloque 13 quedó validado y consolidado en `d1b136d`. La validación final confirmada fue 159/159 tests, lint y build correctos. En el radar de habilidades, los nombres quedaron en 11px y las puntuaciones en 9px.

El Bloque 14 quedó validado funcionalmente con 174/174 tests, lint y build correctos; la migración de `wait_count` / `timing_score` fue aplicada y el flujo `Esperar` fue probado en la web.

## Skills

Las 10 habilidades confirmadas desde `d1b136d` son:

```text
context_reading
trend_reading
range_reading
discipline
false_breakout
breakout_reading
volatility_reading
exhaustion_reading
retest_reading
entry_timing
```

El Bloque 13 añadió especialmente:

- lectura de rupturas;
- volatilidad;
- agotamiento;
- retests;
- Timing.

La página `/skills` presenta **10 habilidades**. Las nueve habilidades de lectura/decisión proceden de `skill_scores`. Desde el Bloque 14, **Timing** amplía de forma compatible el componente `Entrada` del Plan: una espera deliberada también genera evidencia de Timing y, si después existe operación, se combina con la calidad de Entrada. Los intentos anteriores siguen usando Entrada como fallback.

### Presentación del perfil

`/skills` muestra diez habilidades con definiciones sencillas, señales visuales de fortaleza/refuerzo y un radar de diez ejes. La columna lateral se compacta para igualar visualmente la altura del detalle principal y se elimina texto redundante bajo el radar. El dashboard conserva una vista resumida de cinco habilidades para no sobrecargar la portada.

## Explicación de las notas

En el resultado, la sección **Por qué** explica explícitamente las tres dimensiones:

- Lectura: por qué la interpretación inicial recibe esa nota.
- Plan: qué componente entre Entrada, Stop, Objetivo y R:R limita más la puntuación.
- Gestión: qué checkpoint/acción explica mejor la nota obtenida.

Las tarjetas de Lectura / Plan / Gestión muestran debajo del score únicamente `Fuerte | Defendible | Débil`, sin repetir el nombre de la dimensión.

Las explicaciones ya no repiten scores parciales como `0/100`: la nota está en las métricas superiores y **Por qué** se centra en el motivo pedagógico. Lectura / Plan / Gestión se distinguen mediante pills luminosas neutras. Si el usuario elige `No operar`, las cards de Plan y Gestión muestran `No operaste` y la explicación deja claro por qué no aplican. Esta capa es determinista y no cambia las rúbricas ni introduce una nota global.


## Dificultad procedural — Bloque 15

El Bloque 15 introduce una clasificación explícita y determinista de dificultad sin cambiar el scoring del usuario ni añadir columnas a Supabase.

La rúbrica `v1` combina solo información disponible en el punto inicial del ejercicio:

- 55% ambigüedad entre la mejor decisión de Lectura y la segunda;
- 30% complejidad del recorrido visible;
- 15% ruido de microestructura mediante proporción de mechas.

Bandas internas:

```text
0–37   → Fácil
38–65  → Intermedia
66–100 → Difícil
```

La UI muestra solo la banda, no el score interno. En `/train` la cabecera del ejercicio se simplifica para mostrar `Escenario sintético` una sola vez y conservar únicamente la dificultad como metadato destacado; se retiran `Activo oculto`, timeframe duplicado, número de sesión y el aviso superior redundante. El futuro revelado no participa en el cálculo y pulsar **Esperar** no cambia retroactivamente la dificultad inicial del escenario.

`/history` reconstruye la dificultad desde `exercise_id + exercise_version`, por lo que puede mostrarla sin añadir una columna nueva ni una migración.

Esta primera calibración es una heurística pedagógica versionada. El Bloque 15 quedó validado y consolidado en `1335056` con 181/181 tests, lint y build correctos. La dificultad sirve como señal para el selector adaptativo sin convertirse en una etiqueta fija escrita a mano por arquetipo.

No hay migración Supabase en Bloque 15.

## Selector adaptativo — Bloque 16

El candidato del Bloque 16 convierte el selector procedural en adaptativo sin IA y sin una nueva migración.

La selección v1 combina:

- **cobertura**: antes de inferir una debilidad, procura que cada skill tenga al menos dos observaciones en dos escenarios distintos;
- **refuerzo**: después prioriza debilidad histórica, errores de las tres observaciones más recientes y exposición insuficiente;
- **dificultad**: fácil con evidencia débil/escasa, intermedia con rendimiento defendible y difícil solo con rendimiento alto y muestra suficiente;
- **relevancia pedagógica**: la skill objetivo pesa más que acertar exactamente la banda de dificultad cuando ambas señales entran en conflicto;
- **diversidad**: conserva el límite de 64 IDs recientes, evita repetir familia inmediata, favorece familias menos vistas y evita firmas estructurales recientes cuando existen alternativas.

El foco rota de forma determinista entre las tres prioridades superiores y evita insistir inmediatamente en la skill principal del ejercicio anterior cuando existen alternativas, para que «adaptativo» no signifique repetir mecánicamente una única familia. `entry_timing` dispone de una afinidad pedagógica explícita hacia familias donde esperar/confirmar la entrada tiene especial sentido.

El primer escenario se decide con intentos persistidos. Dentro de una misma sesión, cada guardado exitoso devuelve la evidencia oficial recalculada por servidor y el siguiente ejercicio se selecciona con ese perfil actualizado. El usuario no ve la skill objetivo antes de responder para evitar pistas sobre la solución.

### Esperar frente a no operar — Bloque 14

`No operar` sigue siendo una decisión terminal. **Esperar** es una acción temporal distinta: revela una vela y devuelve al usuario a Largo / Corto / No operar con el nuevo punto temporal.

La implementación limita la espera a un máximo de tres velas y conserva al menos ocho velas posteriores para evaluación/gestión. El servidor reconstruye el mismo punto de decisión a partir del escenario y `wait_count`; el navegador no envía el score de Timing.

Timing se calcula de forma determinista: cada decisión de esperar aporta una observación basada únicamente en la información disponible en ese momento y, si la decisión final es direccional, se añade la nota de Entrada del Plan. El resultado sigue mostrando solo Lectura / Plan / Gestión; Timing vive en el perfil de habilidades, no como cuarta nota oficial.

## Flujo

1. Escenario con futuro oculto.
2. Largo / Corto / No operar o, cuando proceda, Esperar una vela y volver a decidir.
3. Confianza.
4. Entrada / Stop / Objetivo si la decisión final es direccional.
5. Revelado progresivo.
6. Gestión en checkpoints.
7. Lectura / Plan / Gestión separadas.
8. Recalculo oficial en servidor.
9. Persistencia.
10. Actualización de historial, habilidades y dashboard.

## Persistencia

Tabla:

```text
public.training_attempts
```

Migraciones del entrenamiento:

```text
supabase/migrations/20260819103000_create_training_attempts.sql
supabase/migrations/20260819215000_add_training_wait_timing.sql   # aplicada Bloque 14
```

La segunda migración añade `wait_count` y `timing_score` sin editar la migración anterior y ya fue aplicada en Supabase.

RLS activo, INSERT no expuesto al cliente, scoring recalculado server-side e idempotencia mediante UUID + fingerprint.

## Progreso

### `/history`

Intentos recientes con dificultad procedural, decisión, outcome, confianza, Lectura, Plan, Gestión y detalle.

### `/skills`

Perfil derivado de intentos persistidos.

### `/dashboard`

- intentos;
- escenarios;
- mejor opción elegida;
- Lectura / Plan / Gestión;
- distribución de decisiones;
- mini historial con flechas/fade;
- habilidades.

Sin nota global oficial.

## Datos futuros

Arquitectura objetivo:

```text
Exercise
├── synthetic procedural
├── synthetic curated
└── historical licensed (futuro)
```

Las tres fuentes deben reutilizar el mismo flujo, scoring, persistencia e histórico.

No integrar históricos reales sin resolver derechos/licencias de uso comercial y visualización.

## IA

Posibles usos futuros: explicación del scoring, resúmenes, detección de patrones y QA.

No debe inventar la respuesta correcta, sustituir rúbricas ni generar señales actuales.

No se han asignado capacidades a planes comerciales.

## Stack

- Next.js `16.2.12`
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- Supabase Auth/Postgres/RLS
- Google OAuth
- Stripe
- Vitest
- npm
- Vercel previsto

## Planes

La infraestructura soporta técnicamente:

```text
free
plus
premium
```

Precios y capacidades finales siguen abiertos. Stripe permanece en Sandbox/Test.

## Desarrollo

```powershell
npm ci
```

```powershell
Copy-Item ".env.example" ".env.local"
```

Nunca compartir `.env.local`.

```powershell
npm run dev
```

Validación completa:

```powershell
npm test; npm run lint; npm run build; git --no-pager diff --check; git status
```

No hacer commit/push hasta validar técnica y visualmente el bloque.

## Continuidad

```text
PRODUCT_CONTEXT.md
PROJECT_HANDOFF.md
PROJECT_SNAPSHOT_<commit>.txt
```

Orden de autoridad:

```text
Git / snapshot
→ PROJECT_HANDOFF.md
→ PRODUCT_CONTEXT.md
→ README.md
→ memoria
```

## Próximos pasos

1. validar la mezcla del selector adaptativo con uso real;
2. reto diario y primera capa de progresión/retención;
3. datos históricos licenciables;
4. onboarding/landing específicos del producto;
5. feedback IA sobre scoring determinista.

## Seguridad y legal

El producto no debe presentarse como señales, recomendaciones personalizadas, copy trading, gestión de cartera, predictor de rentabilidad ni garantía de superar evaluaciones.

Las páginas legales siguen siendo provisionales y requieren revisión específica antes de beta pública o lanzamiento comercial, incluyendo CNMV cuando corresponda.

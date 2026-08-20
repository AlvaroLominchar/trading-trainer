# PROJECT_HANDOFF — trading-trainer

> Documento técnico de continuidad del producto.
>
> **Regla de autoridad:** Git y el `PROJECT_SNAPSHOT_<commit>.txt` cuyo nombre contenga el commit más reciente son la fuente de verdad del código. Este documento resume arquitectura y decisiones, pero un snapshot más reciente siempre prevalece.
>
> **Contexto estable de negocio:** `PRODUCT_CONTEXT.md`.
>
> **Último commit confirmado:** `1335056` — `Add procedural difficulty`.
>
> **Estado de este documento:** Bloque 15 cerrado y consolidado. Bloque 16 — selector adaptativo v1— preparado como candidato sin migración y pendiente de validación del usuario.

---

## 1. Producto

`trading-trainer` es una plataforma SaaS para entrenar toma de decisiones de trading mediante escenarios sintéticos o históricos controlados.

Bucle principal:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

No es un proveedor de señales, predictor de mercado, broker, copy trading ni asesoramiento financiero personalizado.

Principios que no deben romperse:

- Proceso antes que resultado aislado.
- `No operar` es una decisión válida y puede ser la mejor.
- Lectura, Plan y Gestión se evalúan por separado.
- No existe una nota global oficial de trader.
- Scoring determinista, explicable y versionado.
- La confianza no altera la puntuación individual; queda disponible para analítica/calibración futura.
- El futuro revelado no cambia retroactivamente la calidad de la decisión inicial.
- La IA puede explicar o resumir; no debe convertirse en la fuente de verdad del scoring.
- Primera fase con escenarios sintéticos o históricos, sin recomendaciones sobre mercado actual.
- La calidad visual se cierra en cada bloque, no al final.

---

## 2. Repositorio y stack

Repositorio local:

```text
C:\dev\trading-trainer
```

Repositorio GitHub:

```text
https://github.com/AlvaroLominchar/trading-trainer.git
```

Base heredada:

```text
ba997e2
```

Stack conservado:

- Next.js `16.2.12` App Router.
- React `19.2.4`.
- TypeScript.
- Tailwind CSS 4.
- Supabase Auth/Postgres/RLS.
- Google OAuth con sesiones SSR.
- Perfiles.
- Planes técnicos `free`, `plus`, `premium`.
- Stripe Checkout/Portal/webhooks/lifecycle heredado.
- Onboarding.
- Eliminación segura de cuenta.
- Temas semánticos.
- Vitest.
- Vercel previsto.

No reconstruir estas piezas sin una razón técnica explícita.

---

## 3. Historial funcional confirmado hasta `1335056`

Commits principales:

```text
f507478 Initialize trading trainer product
699b6b6 Add trading trainer app shell
c666e5c Add training exercise core
83b335f Make training session playable
d26e3f4 Add trade plan scoring core
03dce89 Add interactive trade planning experience
2d0c017 Add trade management core
49d142b Add progressive trade management experience
08b3d79 Persist training attempts
d0e16a4 Add training history
8c61770 Add skill profile
60e73bf Add polished training dashboard
91280a9 Add procedural synthetic training engine
d1b136d Expand procedural training catalog
2d755ec Add wait decision and timing evaluation
5044b4f Document wait decision flow
1335056 Add procedural difficulty
```

El snapshot `PROJECT_SNAPSHOT_1335056.txt` o uno posterior gobierna el estado exacto.

El Bloque 12 quedó validado y consolidado en `91280a9`. El Bloque 13 quedó validado y consolidado en `d1b136d` con 8 familias procedurales, 10 habilidades, radar de skills, explicaciones de Lectura/Plan/Gestión, selector anti-repetición estructural y los pulidos finales de dashboard/perfil. La validación final del bloque fue 159/159 tests, lint y build correctos.

---

## 4. Entrenamiento existente

La ruta privada `/train` ofrece:

1. gráfico de velas con futuro oculto;
2. decisión terminal `long | short | no_trade`;
3. acción temporal **Esperar 1 vela** antes de la decisión terminal, sin añadir `wait` a `TrainingDecision`;
4. confianza 50–100%;
5. para decisiones direccionales, entrada, stop y objetivo;
6. revelado progresivo;
7. checkpoints de gestión;
8. acciones `hold | close | move_stop`;
9. Lectura / Plan / Gestión separadas;
10. explicación determinista;
11. persistencia segura;
12. selección procedural del siguiente escenario.

La línea que separa información disponible y futuro revelado permanece visible durante la corrección.

---

## 5. Scoring

### Lectura

- `85+`: strong.
- `60–84`: acceptable.
- `<60`: weak.
- Scoring por skills y pesos del ejercicio.
- La confianza no altera el score.

### Plan

Pesos actuales:

```text
entry: 25%
invalidation/stop: 35%
target: 20%
reward/risk: 20%
```

Geometría:

```text
long: stop < entry < target
short: target < entry < stop
```

### Gestión

- Checkpoints relevantes, no cada vela.
- Mantener, Cerrar, Proteger stop.
- El stop solo puede reducir riesgo.
- El scoring usa únicamente información visible.
- `ambiguous` se conserva cuando OHLC no permite inferir orden intrabar.
- `no_trade` no tiene Plan ni Gestión.
- En las tarjetas de resultado, el descriptor inferior es solo `Fuerte | Defendible | Débil`; no repite el nombre de la dimensión.

---

## 6. Persistencia y seguridad

Migración específica aplicada:

```text
supabase/migrations/20260819103000_create_training_attempts.sql
```

Migración del Bloque 14 aplicada en Supabase:

```text
supabase/migrations/20260819215000_add_training_wait_timing.sql
```

Añade `wait_count` y `timing_score` sin editar la migración aplicada.

Tabla:

```text
public.training_attempts
```

Arquitectura:

- navegador envía decisiones brutas;
- servidor reconstruye el ejercicio y recalcula scoring;
- RLS impide INSERT directo del usuario;
- inserción administrativa solo server-side;
- idempotencia mediante UUID + fingerprint SHA-256;
- borrado de cuenta elimina intentos por cascada.

Nunca confiar en scores calculados por el navegador.

---

## 7. Historial, habilidades y dashboard

### `/history`

- Hasta 30 intentos recientes.
- Más reciente primero.
- Muestra la dificultad procedural reconstruida del escenario cuando puede resolverse el ejercicio.
- Decisión y outcome separados.
- Lectura / Plan / Gestión independientes.
- Detalle expandible.
- Sin puntuación global oficial.

### `/skills`

Perfil derivado de `training_attempts`, sin tabla `user_skill_scores`.

- Hasta 60 intentos.
- Promedio simple por observación de skill.
- El peso del ejercicio no se reutiliza como peso permanente.
- Señales de fortaleza/refuerzo requieren evidencia mínima.

### `/dashboard`

- Intentos.
- Variedad reciente expresada como escenarios distintos / intentos dentro de la ventana analizada, para no confundirla con un recuento histórico total.
- Mejor opción elegida.
- Rendimiento Lectura / Plan / Gestión.
- Mejor fase destacada en plata.
- Donut Largo / Corto / No operar.
- Mini historial hasta 12 intentos, viewport acotado, flechas, sin scrollbar visible y fade real.
- Largo/Corto con borde y texto semántico verde/rojo.
- Sello amarillo discreto de intento sólido, derivado y no persistido.
- Habilidades y accesos a vistas completas.

---

## 8. Motor procedural confirmado — Bloque 12

Archivo:

```text
src/features/training/exercises/synthetic-catalog.ts
```

Identidad:

```text
arquetipo + seed + versión → Exercise
```

Formato:

```text
syn-<archetype>-g2-s<seed>
```

Las seeds son reproducibles en cliente y servidor.

Los IDs `g1` de la primera prueba se reconstruyen únicamente para las tres familias legacy.

Familias confirmadas en `91280a9`:

```text
trend-continuation
range-midpoint
false-breakout
```

V2 genera estructura primero y OHLCV después. No transforma simplemente tres gráficos fijos.

El validador comprueba OHLC, timestamps, ventanas, recorrido y volatilidad. Los tests incluyen diversidad geométrica normalizada.

El selector evita repetir IDs, evita repetir familia inmediata cuando hay alternativas y favorece familias menos vistas. El cierre del Bloque 13 amplía la ventana anti-repetición exacta a 64 IDs y evita también repetir una firma estructural reciente —familia + variante + timeframe + dirección— cuando existe otra seed válida. Todavía no es adaptativo por habilidad.

---

## 9. Bloque 13 — ampliación pedagógica

**Estado:** cerrado, validado y consolidado en `d1b136d`.

Objetivo: ampliar la cobertura conceptual sin crear ejercicios manualmente uno a uno ni duplicar el sistema.

### Catálogo objetivo

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

Total: **8 arquetipos procedurales**.

Cada nueva familia tiene seis variantes estructurales deterministas por seed y puede variar dirección cuando procede.

### Skills

Existentes:

```text
context_reading
trend_reading
range_reading
discipline
false_breakout
```

Nuevas en Bloque 13:

```text
breakout_reading
volatility_reading
exhaustion_reading
retest_reading
entry_timing
```

La vista de perfil trabaja con **10 habilidades**. Las nueve habilidades de lectura/decisión proceden de `skill_scores`. En el estado confirmado `d1b136d`, `entry_timing` (Timing) se deriva del componente oficial `entry` de `plan_component_scores` cuando existe una operación direccional.

El radar quedó validado con nombres de skill a **11px** y puntuaciones a **9px**. No hubo migración Supabase en Bloque 13.

### Presentación del perfil

- `/skills` muestra 10 habilidades en una cuadrícula simétrica.
- Cada habilidad incluye ayuda contextual breve mediante un icono `i`.
- La columna de señales diferencia visualmente la habilidad más sólida y la que conviene reforzar.
- La explicación de cálculo distingue observaciones, escenarios y el origen de Timing.
- Se añade un radar de 10 ejes como vista global del perfil.
- La columna derecha de `/skills` se compacta para que Señales, cálculo y radar igualen la altura de la cuadrícula principal en escritorio; se elimina copy redundante bajo el radar.
- El dashboard sigue limitado a 5 habilidades y ambas cards inferiores conservan la misma altura; el mini historial mantiene su scroll por flechas y fade.

### Intención pedagógica

- `breakout-acceptance`: distinguir ruptura aceptada de una simple expansión.
- `range-extreme`: leer rechazo en el borde de un rango y evitar perseguir el extremo.
- `compression`: reconocer contracción de volatilidad y premiar esperar mientras no se resuelva.
- `exhaustion-reversal`: distinguir agotamiento claro de deterioro todavía ambiguo; algunas variantes favorecen reversión y otras `no_trade`.
- `level-retest`: leer un nivel roto cuando funciona desde el lado nuevo.
- `entry_timing`: medir la calidad del momento/ubicación de entrada utilizando el componente Entrada del Plan.

### QA del bloque

Se añaden pruebas para:

- ocho familias únicas;
- determinismo por seed;
- diversidad geométrica por familia;
- invariantes sobre corpus deterministas;
- copy visible neutral;
- jerarquías de decisión específicas;
- planes operables;
- compatibilidad `g1` solo para familias legacy;
- selección de familias menos vistas.

Durante la preparación se ejecutó una comprobación auxiliar sobre **20.000 escenarios** —2.500 seeds por cada una de las ocho familias— sin fallos de `validateSyntheticExercise()`. En el Bloque 12 se había muestreado además otro corpus de 60.000 generaciones de las tres familias originales. Estas cifras son **muestras de QA**, no un catálogo preconstruido de 20.000 o 60.000 ejercicios. El generador admite seeds entre 1 y 999.999.999 por arquetipo; no se afirma que todas las combinaciones posibles estén validadas. También se verificó geometría de Plan en múltiples seeds. Esto no sustituye `npm test`, lint, build ni revisión visual en el entorno del usuario.

No hay migración Supabase en este bloque.

### Explicación de Lectura / Plan / Gestión

La sección **Por qué** del resultado deja de mostrar tres razones genéricas sin dimensión explícita y pasa a asociar una explicación directa a cada métrica:

- **Lectura:** usa el resumen determinista de la rúbrica de decisión.
- **Plan:** identifica el componente más débil entre Entrada, Stop, Objetivo y R:R y explica por qué limita la nota; si todo está fuerte, lo indica. La explicación deja de repetir el score numérico del componente porque la nota ya se muestra arriba.
- **Gestión:** identifica el checkpoint/acción más débil y reutiliza el resumen determinista de su rúbrica, también sin duplicar la puntuación.
- Las etiquetas Lectura / Plan / Gestión dentro de **Por qué** se muestran como pills neutras luminosas para separarlas visualmente del título.
- Para `no_trade`, las cards de Plan y Gestión muestran simplemente **No operaste** y la explicación deja claro por qué esas dimensiones no aplican.

Esto no crea una cuarta nota, no cambia scoring y no usa IA. Solo hace legible el origen de las tres notas existentes.

---

## 10. Bloque 14 — `Esperar` + Timing real

Distinción de producto:

- `no_trade`: decisión terminal; el usuario descarta la oportunidad con la información disponible en el punto final elegido;
- `wait`: acción temporal; revela exactamente una vela y devuelve al usuario a Largo / Corto / No operar con el nuevo punto de decisión.

Arquitectura elegida:

- **no se añade `wait` a `TrainingDecision`**; la decisión persistida sigue siendo `long | short | no_trade`;
- máximo 3 esperas por escenario procedural V2;
- siempre quedan al menos 8 velas posteriores para evaluación/gestión;
- el stage se reconstruye determinísticamente como `Exercise` con `decisionIndex` desplazado, `revealCount` reducido, nueva rúbrica de Lectura y nuevas zonas de Plan basadas solo en la información visible;
- el servidor vuelve a reconstruir el mismo stage a partir del ejercicio original + `wait_count`;
- el navegador nunca envía `timing_score`.

Timing:

- cada espera recibe un score determinista utilizando únicamente la jerarquía Largo/Corto/No operar disponible antes de revelar la siguiente vela;
- esperar puntúa alto cuando todavía no operar es la mejor o una opción robusta;
- esperar pierde puntos cuando ya existe una ventaja direccional clara;
- si la decisión final es direccional, la nota oficial de Entrada se añade como otra observación temporal;
- `timing_score` es la media simple de esas observaciones;
- `no_trade` tras haber esperado puede aportar Timing; `no_trade` sin espera no inventa una observación;
- intentos legacy mantienen como fallback la nota de Entrada.

El resultado continúa mostrando solo Lectura / Plan / Gestión. Timing permanece en el perfil de habilidades y no se convierte en una cuarta puntuación oficial.

---


## 11. Bloque 15 — dificultad procedural explícita

**Estado:** cerrado, validado y consolidado en `1335056`. La validación final fue 181/181 tests, lint y build correctos.

Objetivo: clasificar la dificultad del problema que el usuario ve **antes de revelar futuro**, sin convertirla en una etiqueta arbitraria por familia y sin tocar persistencia.

La dificultad usa una rúbrica determinista y versionada (`v1`) con tres señales:

- **Ambigüedad de decisión (55%)**: distancia entre la mejor alternativa de Lectura y la segunda mejor según las rúbricas existentes. Menor margen = más difícil.
- **Complejidad estructural (30%)**: recorrido acumulado de cierres frente al rango visible. Más rotaciones dentro del mismo espacio = lectura más exigente.
- **Ruido de microestructura (15%)**: proporción media de mechas sobre el rango de las velas visibles.

Bandas v1:

```text
0–37   → Fácil
38–65  → Intermedia
66–100 → Difícil
```

Reglas:

- utiliza únicamente velas hasta `decisionIndex` y rúbricas disponibles en ese punto;
- no usa el futuro revelado, outcome ni resultado económico;
- no modifica Lectura, Plan, Gestión ni Timing;
- no se persiste todavía en Supabase;
- el nivel se recalcula de forma determinista desde el `Exercise`;
- la dificultad del escenario se fija respecto al punto inicial: pulsar **Esperar** no reetiqueta retroactivamente el ejercicio;
- `/train` muestra una única pill neutral `Dificultad · Fácil | Intermedia | Difícil`; se eliminan metadatos redundantes como `Activo oculto`, timeframe duplicado, número de sesión y el aviso superior de datos sintéticos para dar prioridad al gráfico y la decisión;
- el score interno 0–100 no se muestra al usuario; queda preparado para el selector adaptativo posterior;
- `/history` reconstruye el ejercicio desde `exercise_id + exercise_version` y muestra la banda de dificultad sin persistir una nueva columna.

La clasificación es una heurística pedagógica versionada, no una afirmación de dificultad universal. Si el corpus cambia, una futura `v2` deberá introducirse explícitamente en vez de alterar silenciosamente esta calibración.

No hay migración Supabase en este bloque.

---

## 12. Bloque 16 — selector adaptativo v1

**Estado:** candidato preparado sobre `1335056`, sin migración Supabase.

Objetivo: elegir el siguiente escenario según la evidencia real del usuario sin abandonar diversidad, dificultad ni anti-repetición.

Arquitectura v1:

- el servidor carga hasta 64 intentos recientes para exposición y hasta 60 intentos válidos para perfil de skills;
- reutiliza `buildSkillProfile()` como fuente de evidencia, incluida la nota oficial de Timing persistida en Bloque 14;
- mientras alguna skill no tenga al menos 2 observaciones en 2 escenarios distintos, el selector prioriza **cobertura** antes de declarar debilidades prematuras;
- con cobertura mínima, entra en **refuerzo**: combina debilidad histórica, las tres observaciones más recientes y falta de exposición;
- el foco se rota de forma determinista entre las tres prioridades superiores y evita insistir inmediatamente en la skill principal del ejercicio anterior cuando existen alternativas;
- la dificultad objetivo se ajusta de forma conservadora: fácil para evidencia débil o escasa, intermedia para rendimiento defendible y difícil solo con rendimiento alto y evidencia suficiente;
- la skill objetivo pesa más que la dificultad. Si una familia que entrena una skill específica no dispone de la banda deseada, se elige la dificultad más cercana sin sacrificar la relevancia pedagógica;
- el selector conserva la exclusión del ID reciente, evita repetir la familia inmediata y mantiene la firma estructural —familia + variante + timeframe + dirección— como restricción de novedad;
- exposición reciente de familias sigue formando parte del ranking para que adaptación no signifique monotonía;
- `entry_timing` usa una afinidad explícita v1 hacia compresión, aceptación de ruptura, retests, falsas rupturas y agotamiento, porque Timing no forma parte de `Exercise.skills` de Lectura;
- no se muestra al usuario la skill objetivo antes de decidir para no revelar indirectamente la familia o la respuesta esperada.

Después de cada guardado exitoso, `saveTrainingAttempt()` devuelve al cliente únicamente la evidencia oficial necesaria para actualizar el perfil adaptativo de la sesión. El próximo escenario se elige con esa evidencia ya recalculada por servidor; el navegador no inventa scores oficiales.

No se persiste un «nivel adaptativo» ni se añade ninguna tabla. La selección sigue siendo determinista, explicable y versionable.

---

## 13. Datos reales futuros

No crear un segundo sistema para históricos:

```text
Exercise
├── synthetic procedural
├── synthetic curated
└── historical licensed (futuro)

        ↓

mismo TrainingSession
mismo scoring
misma persistencia
mismo historial
mismo perfil
```

Los históricos reales solo deben incorporarse con derechos/licencias adecuados. Sin tiempo real ni recomendaciones actuales en esta fase.

---

## 14. IA futura

Puede explorarse para explicar scoring, resumir sesiones, detectar patrones y ayudar al QA.

No debe inventar la respuesta correcta, sustituir rúbricas, generar señales actuales ni prometer rentabilidad.

No asignar todavía capacidades a Free/Plus/Premium.

---

## 15. Supabase y facturación

Existe proyecto Supabase independiente con Auth, Google OAuth, RLS, perfiles, suscripciones y `training_attempts`.

No modificar migraciones aplicadas. Crear nuevas migraciones si cambia el esquema.

Infraestructura técnica de planes:

```text
free
plus
premium
```

Precios/capacidades finales no definidos. Stripe sigue en Sandbox/Test.

Nunca solicitar ni mostrar secretos o `.env.local`.

---

## 16. Rutas privadas

```text
/dashboard
/train
/history
/skills
/settings
```

---

## 17. Calidad visual

Decisiones validadas:

- UI oscura limpia con tokens semánticos.
- Verde/rojo reservados para trading.
- Resultado con gráfico dominante.
- Dashboard comprensible para nivel intermedio-básico.
- Mejor fase con plata metálica.
- Mini historial con flechas/fade, no scrollbar visible.
- Señales visuales de calidad sin crear una cuarta nota oficial.

---

## 18. Validación obligatoria

```powershell
npm test; npm run lint; npm run build; git --no-pager diff --check; git status
```

Solo tras confirmación del usuario:

```powershell
git add ...; git commit -m "Mensaje descriptivo"; git push origin main; git status
```

---

## 19. Siguiente evolución recomendada

1. validar el selector adaptativo con uso real y revisar su mezcla de foco/diversidad;
2. reto diario y primera capa de progresión/retención;
3. investigación de datos históricos licenciables;
4. onboarding/landing específicos del producto;
5. feedback IA sobre scoring determinista.

---

## 20. Orden de autoridad

```text
Git / snapshot más reciente
        ↓
PROJECT_HANDOFF.md
        ↓
PRODUCT_CONTEXT.md
        ↓
README.md
        ↓
memoria de conversación
```

---

## 21. Decisiones abiertas

- marca y dominio;
- idioma principal definitivo;
- precios;
- capacidades de Free/Plus/Premium;
- proveedor/licencia de datos;
- dificultad procedural;
- QA del corpus;
- taxonomía final de skills/arquetipos;
- fórmula adaptativa;
- IA;
- reto diario;
- competición;
- marketplace;
- adquisición.

---

**Fin de `PROJECT_HANDOFF.md`.**

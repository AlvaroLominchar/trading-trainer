# PROJECT_HANDOFF — trading-trainer

> Documento técnico de continuidad del producto.
>
> **Regla de autoridad:** Git y el `PROJECT_SNAPSHOT_<commit>.txt` cuyo nombre contenga el commit más reciente son la fuente de verdad del código. Este documento resume arquitectura y decisiones, pero un snapshot más reciente siempre prevalece.
>
> **Contexto estable de negocio:** `PRODUCT_CONTEXT.md`.
>
> **Último commit confirmado:** `91280a9` — `Add procedural synthetic training engine`.
>
> **Estado de este documento:** actualizado para acompañar el cierre candidato del Bloque 13. El usuario ya ha validado 154 tests, lint y build sobre la versión anterior del bloque; quedan por validar el pulido final de feedback y el refuerzo de variedad del selector. Hasta hacer commit, `91280a9` sigue siendo el último estado confirmado.

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

## 3. Historial funcional confirmado hasta `91280a9`

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
```

El snapshot `PROJECT_SNAPSHOT_91280a9.txt` o uno posterior gobierna el estado exacto.

El Bloque 12 quedó validado por el usuario y consolidado en `91280a9` con motor procedural V2, seeds reproducibles, selector, reconstrucción server-side, compatibilidad legacy `g1`, QA geométrico y los últimos pulidos de gráfico/dashboard.

---

## 4. Entrenamiento existente

La ruta privada `/train` ofrece:

1. gráfico de velas con futuro oculto;
2. decisión `long | short | no_trade`;
3. confianza 50–100%;
4. para decisiones direccionales, entrada, stop y objetivo;
5. revelado progresivo;
6. checkpoints de gestión;
7. acciones `hold | close | move_stop`;
8. Lectura / Plan / Gestión separadas;
9. explicación determinista;
10. persistencia segura;
11. selección procedural del siguiente escenario.

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

---

## 6. Persistencia y seguridad

Migración específica aplicada:

```text
supabase/migrations/20260819103000_create_training_attempts.sql
```

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

**Estado:** implementación candidata pendiente de validación del usuario y commit.

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

La vista de perfil trabaja con **10 habilidades**. Las nueve habilidades de lectura/decisión proceden de `skill_scores`. `entry_timing` (Timing) se deriva del componente oficial `entry` de `plan_component_scores` cuando existe una operación direccional, por lo que aporta evidencia real sin inventar una nueva nota ni duplicar persistencia.

No hay nueva tabla ni migración Supabase en este ajuste.

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

### Decisión futura: `Esperar` no equivale a `No operar`

Se reserva una evolución del flujo para distinguir:

- `no_trade`: el usuario descarta la oportunidad con la información actual y termina la decisión inicial;
- `wait`: el usuario decide no entrar todavía, pide más confirmación, se revelan nuevas velas y vuelve a decidir después.

Esta segunda opción es especialmente relevante para **Timing** y Disciplina. No se implementa en este ajuste visual porque requiere ampliar la máquina de estados de la sesión y persistir una secuencia de decisiones, probablemente mediante una migración nueva en vez de modificar la migración aplicada de `training_attempts`.

---

## 10. Datos reales futuros

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

## 11. IA futura

Puede explorarse para explicar scoring, resumir sesiones, detectar patrones y ayudar al QA.

No debe inventar la respuesta correcta, sustituir rúbricas, generar señales actuales ni prometer rentabilidad.

No asignar todavía capacidades a Free/Plus/Premium.

---

## 12. Supabase y facturación

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

## 13. Rutas privadas

```text
/dashboard
/train
/history
/skills
/settings
```

---

## 14. Calidad visual

Decisiones validadas:

- UI oscura limpia con tokens semánticos.
- Verde/rojo reservados para trading.
- Resultado con gráfico dominante.
- Dashboard comprensible para nivel intermedio-básico.
- Mejor fase con plata metálica.
- Mini historial con flechas/fade, no scrollbar visible.
- Señales visuales de calidad sin crear una cuarta nota oficial.

---

## 15. Validación obligatoria

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

Solo tras confirmación del usuario:

```powershell
git add ...; git commit -m "Mensaje descriptivo"; git push origin main; git status
```

---

## 16. Siguiente evolución recomendada

Si Bloque 13 queda validado:

1. validar las 8 familias y la nueva presentación de 10 habilidades;
2. diseñar la acción explícita **Esperar** como distinta de `no_trade`: revelar una o varias velas y permitir decidir después;
3. enriquecer Timing con esa secuencia de espera, además de la calidad de Entrada que ya puede medir hoy;
4. dificultad procedural explícita;
5. selección por skills débiles, errores recientes y exposición;
6. entrenamiento adaptativo real;
7. reto diario;
8. investigación de datos históricos licenciables;
9. feedback IA sobre scoring determinista.

---

## 17. Orden de autoridad

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

## 18. Decisiones abiertas

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

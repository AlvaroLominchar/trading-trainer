# PROJECT_HANDOFF — trading-trainer

> Documento técnico de continuidad del producto.
>
> **Regla de autoridad:** Git y el `PROJECT_SNAPSHOT_<commit>.txt` cuyo nombre contenga el commit más reciente son la fuente de verdad del código. Este documento resume arquitectura y decisiones, pero un snapshot más reciente siempre prevalece.
>
> **Contexto estable de negocio:** `PRODUCT_CONTEXT.md`.
>
> **Último commit confirmado antes del Bloque 12:** `60e73bf` — `Add polished training dashboard`.
>
> **Estado de este documento:** actualizado para acompañar el Bloque 12 — motor de catálogo sintético procedural. Hasta que el usuario valide y haga commit del bloque, comprobar `git status` y el snapshot más reciente antes de asumir que el Bloque 12 está cerrado.

---

## 1. Producto

`trading-trainer` es una plataforma SaaS de entrenamiento de toma de decisiones para traders.

Bucle principal:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

No es un proveedor de señales, predictor de mercado, broker, copy trading ni asesoramiento financiero personalizado.

Principios que no deben romperse:

- Proceso antes que resultado aislado.
- `No operar` es una decisión válida y puede ser la mejor.
- Scoring determinista, explicable y versionado.
- La confianza no altera la puntuación individual del ejercicio; sirve para analítica/calibración futura.
- El futuro revelado no cambia retroactivamente la calidad de la decisión inicial.
- La IA puede explicar o resumir; no debe convertirse en la fuente de verdad del scoring.
- Primera fase con escenarios históricos o sintéticos, sin recomendaciones sobre mercado actual.
- La calidad visual se cierra en cada bloque, no al final.

---

## 2. Repositorio y stack

Repositorio local previsto:

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

## 3. Historial funcional confirmado hasta `60e73bf`

Commits principales del producto:

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
```

El snapshot `PROJECT_SNAPSHOT_60e73bf.txt` o uno posterior gobierna el estado exacto.

---

## 4. Entrenamiento existente

La ruta privada `/train` ofrece un ejercicio completo:

1. gráfico de velas con futuro oculto;
2. decisión `long | short | no_trade`;
3. confianza 50–100%;
4. para decisiones direccionales, plan con entrada, stop y objetivo;
5. revelado progresivo vela a vela;
6. checkpoints de gestión;
7. acciones `hold | close | move_stop`;
8. resultado con Lectura / Plan / Gestión separadas;
9. explicación determinista;
10. persistencia segura del intento.

La media visual mostrada en el resultado no es una cuarta puntuación oficial y no se persiste.

### Skills actuales

```text
context_reading
trend_reading
range_reading
discipline
false_breakout
```

### Familias base actuales

```text
trend-continuation
range-midpoint
false-breakout
```

Antes del Bloque 12 existían como tres ejercicios sintéticos controlados en `src/features/training/exercises/demo-exercises.ts`.

---

## 5. Scoring

### Lectura / idea

- Determinista.
- `85+`: strong.
- `60–84`: acceptable.
- `<60`: weak.
- El scoring se calcula por skill y pesos del ejercicio.
- La confianza no altera el score.

### Plan

Dimensión independiente de Lectura.

Componentes:

```text
entry: 25%
invalidation/stop: 35%
target: 20%
reward/risk: 20%
```

Las zonas se degradan de forma continua fuera del rango óptimo.

Geometría:

```text
long: stop < entry < target
short: target < entry < stop
```

### Gestión

- Checkpoints relevantes, no cada vela.
- Acciones: mantener, cerrar, proteger stop.
- El stop solo puede reducir riesgo.
- El scoring usa únicamente la información visible en el checkpoint.
- Si una vela toca stop y target sin orden intrabar conocido, el resultado puede ser `ambiguous`.
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

- El navegador envía decisiones brutas.
- El servidor reconstruye el ejercicio y recalcula Lectura / Plan / Gestión.
- El usuario autenticado no inserta directamente por RLS.
- La inserción se hace server-side con cliente administrativo.
- Idempotencia mediante UUID de intento y fingerprint SHA-256.
- Un UUID repetido con payload idéntico se acepta.
- Un UUID repetido con contenido distinto se rechaza.
- Eliminación de cuenta elimina intentos por cascada.

Se persisten, entre otros:

- exercise id/version/title/timeframe/source;
- decisión y confianza;
- plan;
- scoring de Lectura y skills;
- scoring de Plan;
- scoring y acciones de Gestión;
- outcome y exit price.

Nunca confiar en el score calculado en el navegador.

---

## 7. Historial, habilidades y dashboard

### `/history`

- Hasta 30 intentos recientes.
- Más reciente primero.
- Decisión y outcome separados.
- Lectura / Plan / Gestión independientes.
- Detalle expandible de skills, plan y gestión.
- Sin puntuación global oficial.

### `/skills`

Perfil derivado de intentos persistidos, sin tabla materializada `user_skill_scores`.

- Hasta 60 intentos recientes.
- Promedio simple por observación de skill.
- El `weight` interno del ejercicio no se reutiliza para ponderar permanentemente el perfil.
- Señales de fortaleza/refuerzo requieren evidencia mínima.
- No existe un “trader score” global.

### `/dashboard`

Dashboard real y aprobado visualmente en `60e73bf`:

- Intentos.
- Escenarios.
- Mejor opción elegida.
- Rendimiento por fase con Lectura / Plan / Gestión.
- Mejor fase con tratamiento plateado destacado.
- Distribución de decisiones con donut.
- Historial reciente y acceso al historial completo; el Bloque 12 V2 corrige el límite para mostrar hasta 12 intentos con scroll real.
- Habilidades y acceso al perfil completo.
- Sin tarjetas redundantes de “última sesión” o “foco actual”.
- Sin una nota global de trader.

---

## 8. Bloque 12 — motor de catálogo sintético procedural

Objetivo: dejar de depender de crear ejercicios manualmente uno a uno y preparar una fuente amplia de entrenamiento sintético reproducible sin convertir la rúbrica en una caja negra.

**Estado:** implementación candidata V2, pendiente de validación visual/funcional del usuario y de commit. El primer intento del Bloque 12 (`g1`) transformaba templates existentes y produjo formas demasiado parecidas; no debe considerarse la arquitectura objetivo.

### Motor V2

Archivo principal:

```text
src/features/training/exercises/synthetic-catalog.ts
```

Identidad reproducible:

```text
arquetipo + seed + versión de generador → Exercise
```

ID actual:

```text
syn-<archetype>-g2-s<seed>
```

Ejemplo:

```text
syn-range-midpoint-g2-s4242
```

El servidor puede reconstruir exactamente un escenario desde su ID y versión. Los IDs `g1` ya persistidos durante la prueba inicial siguen siendo reconstruibles por compatibilidad, pero las nuevas selecciones usan `g2`.

### Cómo genera V2

V2 ya no escala ni desplaza la serie de velas de los tres templates. Genera una estructura nueva desde parámetros latentes del arquetipo y después sintetiza OHLCV alrededor de esa estructura.

Variación actual:

- 6 estilos estructurales por familia;
- long/short espejados cuando la familia lo permite;
- timeframes `5m`, `15m` y `1h`;
- número y duración variables de impulsos, retrocesos y rotaciones;
- profundidad variable de pullbacks y extremos;
- rangos estables, contractivos, expansivos, con deriva o más irregulares;
- falsas rupturas de ambos lados con fallos de una o varias fases;
- ruido de microestructura determinista dentro de cada tramo;
- clustering simple de volatilidad, shocks ocasionales, wicks y volumen;
- precio base y timestamps variables.

Las tres familias pedagógicas siguen siendo:

```text
trend-continuation
range-midpoint
false-breakout
```

Esto aporta profundidad dentro de cada familia, pero todavía no sustituye ampliar el número de conceptos pedagógicos.

### Rúbricas y seguridad pedagógica

- La verdad del ejercicio nace del arquetipo y de sus parámetros latentes, no del futuro generado después.
- En tendencia, la dirección preferida puede ser long o short según la seed.
- En rango medio, `no_trade` sigue siendo la lectura fuerte.
- En falsa ruptura, `no_trade` sigue siendo la opción más robusta y la reversión es defendible pero inferior.
- Las zonas de Entrada/Stop/Objetivo se derivan de la estructura visible y ATR reciente.
- Gestión conserva checkpoints deterministas en `+2`, `+5`, `+8`.
- Título, prompt y `source.label` son neutrales y no revelan al usuario qué familia se está evaluando.

### QA automático del generador

`validateSyntheticExercise()` comprueba como mínimo:

- OHLC válido;
- precios positivos;
- timestamps crecientes;
- ventana visible/revelado válidos;
- recorrido suficiente frente a volatilidad;
- ausencia de velas desproporcionadas respecto al ATR del escenario.

Los tests de V2 añaden además una regresión de **diversidad geométrica normalizada** para impedir volver accidentalmente al comportamiento de `g1`, donde varias seeds eran esencialmente la misma forma trasladada o escalada.

Antes de empaquetar esta iteración se ha realizado también una comprobación estadística interna sobre decenas de miles de seeds y una revisión visual de muestras de las tres familias. Esto no sustituye la validación del usuario ni una futura calibración contra datos históricos reales.

### Selector

El selector procedural:

- evita repetir exactamente IDs recientes;
- evita repetir la misma familia de forma inmediata cuando hay alternativas;
- favorece familias menos vistas dentro de la ventana reciente;
- descarta cualquier seed que no supere el validador;
- todavía **no** es entrenamiento adaptativo por habilidad;
- no usa IA;
- no necesita una migración nueva.

La ruta `/train` consulta IDs recientes mediante Supabase/RLS y el servidor vuelve a reconstruir el ejercicio al persistir para recalcular la evaluación oficial.

### Dashboard relacionado

La card **Historial reciente** del dashboard pasa a conservar hasta 12 intentos del resumen y utiliza scroll vertical dentro de una altura acotada. El acceso **Ver historial completo** sigue llevando a `/history`.

### Alcance real

El espacio de seeds es muy grande, pero no se debe vender como “millones de ejercicios validados”. V2 resuelve variación reproducible dentro de tres familias. La siguiente ampliación debe añadir más arquetipos y, cuando dispongamos de un dataset histórico con derechos resueltos, usarlo también para calibrar propiedades estadísticas del generador.

---

## 9. Compatibilidad con datos reales futuros

No crear un segundo sistema de entrenamiento para datos históricos.

Dirección arquitectónica:

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
mismo perfil de habilidades
```

Los datos históricos reales deberán utilizarse solo cuando los derechos/licencias permitan el uso comercial y la visualización necesaria.

Sin tiempo real ni recomendaciones actuales en esta fase.

---

## 10. IA futura

La IA puede evaluarse posteriormente para:

- explicar el scoring determinista en lenguaje natural;
- resumir sesiones;
- detectar patrones de errores históricos;
- adaptar el nivel de detalle de las explicaciones;
- ayudar internamente al etiquetado/QA de escenarios.

No debe:

- inventar la respuesta correcta;
- sustituir la rúbrica determinista;
- generar señales actuales;
- prometer rentabilidad.

No asignar todavía estas capacidades a Free/Plus/Premium.

---

## 11. Supabase

Existe un proyecto Supabase independiente del template.

Configuración ya realizada durante el desarrollo:

- Auth.
- Google OAuth.
- RLS.
- perfiles y suscripciones heredados;
- `training_attempts` específico del producto.

CLI inicializado y vinculado.

No modificar migraciones ya aplicadas. Crear una migración nueva para cualquier cambio futuro de esquema.

Nunca solicitar ni mostrar secretos o `.env.local`.

---

## 12. Facturación

Infraestructura heredada:

```text
free
plus
premium
```

Stripe continúa como infraestructura técnica heredada y debe mantenerse en Sandbox/Test hasta decisión de lanzamiento.

Los precios y capacidades concretas de planes no están definidos para el negocio. No inventarlos.

Hipótesis futuras, no compromisos de plan:

- catálogo ampliado;
- datos históricos reales;
- feedback/analítica con IA;
- entrenamiento adaptativo;
- modos de presión;
- retos, ligas o packs.

---

## 13. Rutas privadas principales

```text
/dashboard
/train
/history
/skills
/settings
```

Navegación desktop actual:

```text
Dashboard
Entrenar
Historial
Habilidades
Configuración
```

En móvil se usan etiquetas compactas equivalentes.

---

## 14. Calidad visual

Decisiones visuales ya validadas:

- UI oscura limpia con tokens semánticos.
- Verde/rojo reservados para semántica de trading, no decoración arbitraria.
- Resultado con gráfico dominante y evaluación compacta.
- Dashboard sencillo de entender para un usuario de trading intermedio-básico.
- Mejor fase destacada en plata metálica con destellos discretos.
- Historial reciente y habilidades como bloques principales del dashboard.

No introducir decoración gratuita ni jerarquías de texto excesivas.

---

## 15. Validación obligatoria

Después de aplicar un bloque importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

Solo después de que el usuario confirme que funciona:

```powershell
git add ...; git commit -m "Mensaje descriptivo"; git push origin main; git status
```

No hacer commit/push antes de validación visual y técnica del usuario.

---

## 16. Siguiente evolución recomendada después del Bloque 12

No saltar inmediatamente a “IA adaptativa” con solo tres familias.

Orden recomendado:

1. validar visual y pedagógicamente múltiples seeds de las tres familias;
2. añadir más arquetipos estructurales;
3. incorporar un validador/QA automático de escenarios;
4. definir dificultad de forma explícita;
5. después conectar selección por habilidades y errores recientes;
6. más adelante explorar reto diario;
7. investigar datos históricos con derechos de uso;
8. evaluar una capa de explicación con IA sobre scoring determinista.

Posibles nuevas familias:

- pullback en tendencia;
- ruptura válida;
- compresión;
- expansión de volatilidad;
- extremo de rango;
- agotamiento;
- contexto ambiguo/no trade.

---

## 17. Documentos y orden de autoridad

Al continuar en otro chat:

1. instrucciones del proyecto;
2. `PRODUCT_CONTEXT.md`;
3. `PROJECT_HANDOFF.md`;
4. snapshot más reciente;
5. `README.md`;
6. archivos afectados.

En caso de conflicto:

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

Siguen abiertas:

- marca y dominio;
- idioma principal definitivo;
- precios;
- capacidades de Free/Plus/Premium;
- proveedor/licencia de datos históricos;
- universo final de mercados;
- número y taxonomía final de arquetipos;
- dificultad procedural;
- QA de corpus sintético;
- fórmula de entrenamiento adaptativo;
- uso exacto de IA;
- reto diario;
- ligas/competición;
- marketplace/creadores;
- estrategia de adquisición.

---

**Fin de `PROJECT_HANDOFF.md`.**

# Trading Trainer

Nombre técnico provisional de una plataforma SaaS para entrenar toma de decisiones de trading mediante escenarios sintéticos o históricos controlados.

> Producto en desarrollo. No ofrece señales, recomendaciones de inversión, ejecución de operaciones ni promesas de rentabilidad.

## Concepto

Trading Trainer funciona como un **gimnasio de decisiones**:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

El objetivo no es reproducir un terminal de trading completo, sino convertir aprendizaje pasivo en práctica corta, visual y medible.

## Estado funcional

El producto ya incluye:

- autenticación con Supabase + Google OAuth;
- aplicación privada con navegación real;
- entrenamiento jugable;
- gráfico de velas con futuro oculto;
- decisión `largo | corto | no operar`;
- confianza 50–100%;
- entrada, stop y objetivo para decisiones direccionales;
- scoring determinista de Lectura;
- scoring independiente de Plan;
- gestión progresiva vela a vela con checkpoints;
- scoring independiente de Gestión;
- resultado visual explicable;
- persistencia segura server-side;
- historial de intentos;
- perfil de habilidades;
- dashboard real y pulido;
- motor procedural sintético basado en arquetipos + seeds reproducibles;
- selector de escenarios que reduce repetición reciente.

El último commit confirmado antes de introducir el motor procedural es:

```text
60e73bf Add polished training dashboard
```

Para el estado exacto actual, usar Git y el `PROJECT_SNAPSHOT_<commit>.txt` más reciente.

## Principios de producto

- El proceso importa más que el resultado aislado.
- Una operación ganadora puede ser una mala decisión.
- Una operación perdedora puede estar bien ejecutada.
- `No operar` puede ser la mejor respuesta.
- Lectura, Plan y Gestión se evalúan por separado.
- No existe una nota global oficial de “trader”.
- La confianza no altera el score individual del ejercicio.
- El futuro revelado no modifica retroactivamente la calidad de la decisión.
- El scoring debe ser explicable, determinista, versionado y testeable.
- La IA no será la fuente de verdad de la evaluación.
- No se usarán señales ni recomendaciones sobre mercado actual en esta fase.

## Motor de ejercicios

### Templates controlados

Las primeras familias se originaron en tres escenarios sintéticos canónicos:

```text
trend-continuation
range-midpoint
false-breakout
```

Los templates permanecen en:

```text
src/features/training/exercises/demo-exercises.ts
```

### Generación procedural

El motor vive en:

```text
src/features/training/exercises/synthetic-catalog.ts
```

La versión candidata actual es `g2` y se identifica mediante:

```text
arquetipo + seed + versión de generador
```

Ejemplo:

```text
syn-range-midpoint-g2-s4242
```

La misma seed reconstruye exactamente el mismo escenario también en servidor. Los IDs `g1` generados durante la primera prueba siguen siendo resolubles por compatibilidad, pero `g1` no se usa para escenarios nuevos porque se basaba demasiado en transformar templates existentes y producía geometrías visualmente repetitivas.

V2 genera una estructura nueva y después sintetiza las velas. Actualmente varía de forma determinista:

- seis estilos estructurales por familia;
- dirección long/short cuando procede;
- timeframe `5m`, `15m` o `1h`;
- número y duración de impulsos, pullbacks y rotaciones;
- profundidad de retrocesos y extremos;
- rangos estables, contractivos, expansivos, con deriva o más irregulares;
- falsas rupturas superiores e inferiores de distintas formas;
- microestructura dentro de los tramos;
- volatilidad, shocks, wicks, volumen, precio base y timestamps.

El motor genera además rúbricas coherentes con los parámetros latentes del escenario. Entrada/Stop/Objetivo se derivan de estructura visible y volatilidad, mientras Lectura y Gestión siguen siendo deterministas y versionadas. El título y la fuente visibles son neutrales para no revelar el patrón al usuario.

Existe un validador automático de OHLC, ventanas, timestamps y relaciones básicas entre estructura y volatilidad. Los tests incluyen una medida de diversidad geométrica normalizada para evitar regresar a un sistema que solo desplace o escale la misma forma.

La implementación continúa restringida a tres familias pedagógicas. Un espacio grande de seeds no equivale a un catálogo definitivo: faltan más arquetipos, dificultad explícita y, a futuro, calibración estadística frente a datos históricos con derechos resueltos.

### Selector

El selector actual:

- evita repetir exactamente los ejercicios recientes;
- intenta no repetir la misma familia de forma consecutiva;
- favorece familias menos vistas en la ventana reciente.

Todavía no selecciona ejercicios a partir de debilidades del perfil. Esa será una evolución posterior cuando exista suficiente variedad de contenido.

## Flujo de entrenamiento

1. Se presenta un escenario con futuro oculto.
2. El usuario decide `Largo`, `Corto` o `No operar`.
3. Declara confianza.
4. Si elige dirección, define Entrada, Stop y Objetivo.
5. Se revela el mercado progresivamente.
6. En checkpoints relevantes puede Mantener, Cerrar o Proteger el stop.
7. Se muestran Lectura, Plan y Gestión de forma separada.
8. El servidor recalcula la evaluación oficial.
9. El intento se persiste.
10. Historial, habilidades y dashboard se actualizan a partir de datos reales.

## Persistencia

La tabla específica del producto es:

```text
public.training_attempts
```

Migración:

```text
supabase/migrations/20260819103000_create_training_attempts.sql
```

Seguridad:

- RLS activo.
- El navegador no inserta intentos directamente.
- El servidor vuelve a calcular el scoring.
- Inserción con cliente administrativo solo en servidor.
- Idempotencia con UUID y fingerprint SHA-256.
- Eliminación de cuenta en cascada.

## Progreso

### Historial

Ruta:

```text
/history
```

Muestra intentos recientes con decisión, outcome, confianza, Lectura, Plan, Gestión y detalles expandibles.

### Habilidades

Ruta:

```text
/skills
```

Perfil derivado de intentos persistidos, sin tabla materializada adicional por ahora.

Skills actuales:

```text
context_reading
trend_reading
range_reading
discipline
false_breakout
```

### Dashboard

Ruta:

```text
/dashboard
```

Incluye:

- número de intentos;
- escenarios practicados;
- proporción de mejores decisiones elegidas;
- Rendimiento por fase: Lectura / Plan / Gestión;
- distribución de Largo / Corto / No operar;
- historial reciente con hasta 12 intentos y scroll interno;
- habilidades.

No muestra una nota global oficial.

## Datos sintéticos e históricos

Dirección de arquitectura:

```text
Exercise
├── synthetic procedural
├── synthetic curated
└── historical licensed (futuro)
```

Todos deben poder utilizar el mismo flujo de entrenamiento, scoring, persistencia, historial y perfil.

La primera versión no depende de un proveedor comercial de datos.

Para datos históricos reales:

1. resolver derechos de uso;
2. validar licencia para uso comercial y visualización externa;
3. integrarlos como otra fuente de `Exercise`;
4. no convertirlos en recomendaciones sobre mercado actual.

No asumir que datos visibles gratuitamente en Internet pueden redistribuirse comercialmente.

## IA

Usos potenciales posteriores:

- explicar el scoring determinista en lenguaje natural;
- resumir sesiones;
- detectar patrones de error;
- adaptar el nivel de detalle del feedback;
- ayudar internamente al etiquetado y QA.

La IA no debe:

- inventar la respuesta correcta;
- sustituir las rúbricas;
- generar señales actuales;
- predecir mercados como propuesta central;
- prometer rentabilidad.

No se han asignado capacidades de IA a ningún plan comercial.

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

## Planes y facturación

La infraestructura heredada soporta técnicamente:

```text
free
plus
premium
```

Los precios y capacidades finales no están definidos.

No asumir todavía que IA, datos reales, catálogo ampliado u otras funciones pertenecen a un plan concreto.

Stripe debe permanecer en Sandbox/Test durante el desarrollo inicial.

## Desarrollo local

Instalar dependencias:

```powershell
npm ci
```

Crear entorno local a partir del ejemplo:

```powershell
Copy-Item ".env.example" ".env.local"
```

Nunca compartir ni subir `.env.local`.

Arrancar:

```powershell
npm run dev
```

Aplicación local normalmente en:

```text
http://localhost:3000
```

## Validación

Pruebas:

```powershell
npm test
```

Lint:

```powershell
npm run lint
```

Build:

```powershell
npm run build
```

Validación completa antes de cerrar un bloque:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

No hacer commit/push hasta validar técnica y visualmente el bloque.

## Arquitectura y continuidad

Contexto de negocio:

```text
PRODUCT_CONTEXT.md
```

Handoff técnico:

```text
PROJECT_HANDOFF.md
```

Fuente de verdad del código:

```text
Git + PROJECT_SNAPSHOT_<commit>.txt más reciente
```

Orden de autoridad:

```text
Git / snapshot
→ PROJECT_HANDOFF.md
→ PRODUCT_CONTEXT.md
→ README.md
→ memoria de conversación
```

## Próximos pasos recomendados

Antes de activar entrenamiento adaptativo completo:

1. revisar varias seeds de cada familia actual;
2. ampliar arquetipos;
3. crear QA automático del generador;
4. introducir dificultad explícita;
5. conectar selección con skills/errores recientes;
6. estudiar reto diario;
7. investigar datos históricos licenciables;
8. evaluar feedback con IA sobre scoring determinista.

Familias candidatas futuras:

- pullback en tendencia;
- ruptura válida;
- extremo de rango;
- compresión;
- expansión de volatilidad;
- agotamiento;
- contexto ambiguo / no operar.

## Seguridad y legal

El producto no debe presentarse como:

- señales de inversión;
- recomendaciones personalizadas;
- copy trading;
- gestión de cartera;
- predictor de rentabilidad;
- garantía de superar retos/evaluaciones.

Las páginas legales continúan siendo provisionales. Antes de beta pública o lanzamiento comercial debe realizarse una revisión específica del perímetro regulatorio y de la comunicación del producto, incluyendo CNMV cuando corresponda.

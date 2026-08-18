# Trading Trainer

Nombre técnico provisional de una plataforma SaaS para entrenar toma de decisiones de trading mediante escenarios históricos o controlados.

> El producto está en desarrollo. No ofrece señales, recomendaciones de inversión, ejecución de operaciones ni promesas de rentabilidad.

## Concepto

La experiencia se diseña como un **gimnasio de decisiones**:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

El objetivo no es reproducir un terminal de trading completo, sino convertir parte del aprendizaje pasivo en ejercicios cortos, interactivos y medibles.

La primera versión prioriza:

- Escenarios históricos o sintéticos.
- Futuro oculto durante el ejercicio.
- Decisiones `largo`, `corto` o `no operar`.
- Nivel de confianza.
- Revelado progresivo.
- Evaluación explicable.
- Perfil de habilidades.
- Diseño visual cuidado y apto para móvil y escritorio.

## Principios

- El proceso importa más que el resultado aislado.
- Ganar una operación no convierte automáticamente una decisión en buena.
- Perder una operación no convierte automáticamente una decisión en mala.
- `No operar` debe poder ser una respuesta excelente.
- La puntuación debe ser explicable y testeable.
- La IA no será la fuente de verdad de los ejercicios.
- La primera versión no utilizará señales ni recomendaciones sobre mercados actuales.
- La experiencia visual se pulirá durante el desarrollo, no al final.

## Contexto del producto

La definición estable vive en:

```text
PRODUCT_CONTEXT.md
```

El estado técnico y las instrucciones de continuidad viven en:

```text
PROJECT_HANDOFF.md
```

Para cambios técnicos, Git y el `PROJECT_SNAPSHOT_<commit>.txt` más reciente son la fuente de verdad.

## Estado actual

El producto parte de la plantilla SaaS en el commit:

```text
ba997e2
```

Actualmente conserva la infraestructura heredada:

- Next.js 16.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Google OAuth mediante Supabase Auth.
- Sesiones SSR.
- PostgreSQL y Row Level Security.
- Perfiles.
- Planes Free, Plus y Premium.
- Stripe Checkout.
- Customer Portal.
- Webhooks.
- Onboarding.
- Eliminación de cuenta.
- Temas semánticos.
- Páginas legales provisionales.
- Cabeceras de seguridad.
- Vitest.
- Despliegue previsto en Vercel.

Todavía no se ha implementado el motor de entrenamiento.

## Stack

- Next.js `16.2.12`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript
- Tailwind CSS 4
- Supabase
- PostgreSQL
- Stripe
- Vitest
- npm
- Vercel

## Requisitos

- Node.js `20.9` o superior.
- npm.
- Supabase para autenticación y base de datos.
- Google OAuth.
- Stripe Sandbox/Test mientras el producto esté en desarrollo.
- Vercel como despliegue recomendado.

## Instalación local

Instala las dependencias exactas del lockfile:

```powershell
npm ci
```

Crea las variables locales a partir del ejemplo:

```powershell
Copy-Item ".env.example" ".env.local"
```

Nunca subas `.env.local` al repositorio ni compartas sus secretos.

Arranca el entorno:

```powershell
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:3000
```

## Scripts

Desarrollo:

```powershell
npm run dev
```

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

Servidor de producción local:

```powershell
npm run start
```

Validación completa antes de cerrar un bloque importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

## Datos de mercado

La primera versión no dependerá de un proveedor comercial.

Estrategia prevista:

1. Datos sintéticos o controlados durante desarrollo.
2. Derechos de uso resueltos para alpha.
3. Proveedor o licencia con permiso comercial y visualización externa antes de beta pública.
4. Ampliar mercados solo cuando el uso justifique el coste.

No asumir que los datos visibles gratuitamente en Internet pueden redistribuirse comercialmente.

Google Finance no se considera una fuente adecuada para alimentar este producto.

## Mercado inicial previsto

De forma provisional:

- BTC spot.
- ETH spot.
- Sin tiempo real.
- Sin derivados.
- Escenarios históricos o sintéticos.
- Activo y fecha ocultos cuando sea útil para el entrenamiento.

## IA

Usos potenciales posteriores:

- Explicar resultados.
- Resumir sesiones.
- Detectar patrones en errores.
- Ayudar al etiquetado.

No debe utilizarse inicialmente para generar señales, predecir mercados ni decidir por sí sola la respuesta correcta.

## Facturación

La infraestructura heredada soporta:

```text
free
plus
premium
```

Los precios actuales de la plantilla son provisionales y no representan la estrategia comercial final.

Las capacidades de cada plan se definirán únicamente cuando exista suficiente evidencia sobre qué funciones aportan valor.

Stripe debe permanecer en Sandbox/Test durante el desarrollo inicial.

## Seguridad y legal

El producto no debe presentarse como:

- Señales de inversión.
- Recomendaciones personalizadas.
- Copy trading.
- Gestión de cartera.
- Predictor de rentabilidad.
- Garantía de superar evaluaciones o retos.

Las rutas legales heredadas siguen siendo provisionales:

```text
/legal
/privacy
/terms
/cookies
```

Antes de una beta pública o lanzamiento comercial deberán adaptarse al producto y realizarse una revisión específica del perímetro regulatorio aplicable.

## Roadmap resumido

### Fundamentos

- Contexto de producto.
- Identidad provisional.
- Modelo de ejercicio.
- Taxonomía.
- Scoring.
- Dataset interno.

### Primer entrenamiento

- Gráfico.
- Decisión.
- Confianza.
- Revelado.
- Evaluación.
- Diseño responsive.

### Progreso

- Persistencia.
- Historial.
- Perfil de habilidades.
- Dashboard real.
- Reto diario.

### Entrenamiento adaptativo

- Baraja de errores.
- Selección personalizada.
- Repetición.
- Resumen de progreso.

### Producto comercial

- Landing definitiva.
- Onboarding.
- Analítica.
- Planes.
- Revisión legal.
- Datos licenciados.
- Stripe Live cuando proceda.

### Futuro

- Ligas.
- Temporadas.
- Modos de presión.
- Packs.
- Creadores.
- Marketplace.

## Forma de trabajo

Antes de modificar código:

1. Revisar `PRODUCT_CONTEXT.md`.
2. Revisar `PROJECT_HANDOFF.md`.
3. Revisar el snapshot más reciente.
4. Revisar los archivos implicados.

Después de cada bloque importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

No realizar `push` hasta validar el bloque.

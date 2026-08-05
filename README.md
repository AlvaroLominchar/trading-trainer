# Plantilla SaaS

Base reutilizable para construir aplicaciones SaaS con autenticación, perfiles, planes, suscripciones, temas, onboarding y eliminación segura de cuentas.

## Funcionalidad incluida

- Next.js 16 con App Router, TypeScript y Tailwind CSS 4.
- Autenticación con Google mediante Supabase Auth y sesiones SSR.
- Perfil de usuario almacenado en PostgreSQL con Row Level Security.
- Planes centralizados: Free, Plus y Premium.
- Stripe Checkout, Customer Portal y webhooks firmados.
- Sincronización idempotente del ciclo de suscripción.
- Recuperación de pagos fallidos y degradación automática a Free.
- Cancelación programada, cancelación definitiva y resuscripción.
- Protección genérica por plan mínimo.
- Onboarding reutilizable para nuevas cuentas.
- Eliminación segura de cuenta, datos asociados y facturación.
- Cuatro temas semánticos: `midnight`, `light`, `violet` y `forest`.
- Pruebas unitarias de planes y política de facturación.

## Tecnologías

- Next.js `16.2.12`
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL y RLS
- Stripe Billing
- Vitest
- Vercel

## Requisitos

- Node.js `20.9` o superior.
- npm.
- Un proyecto de Supabase.
- Un proyecto de Google Cloud para OAuth.
- Una cuenta de Stripe con acceso al modo Sandbox/Test.
- Una cuenta de Vercel para el despliegue recomendado.

## Instalación local

Clona el repositorio e instala las dependencias:

```powershell
git clone TU_REPOSITORIO; cd plantilla-saas; npm install
```

Crea el archivo local de variables:

```powershell
Copy-Item ".env.example" ".env.local"
```

Completa `.env.local` con tus propios valores y arranca el proyecto:

```powershell
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Exposición | Descripción |
|---|---|---|
| `APP_THEME` | Servidor | Preset visual: `midnight`, `light`, `violet` o `forest`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto de Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Clave publicable de Supabase para navegador y SSR. |
| `SUPABASE_SECRET_KEY` | Secreta | Clave administrativa usada exclusivamente en servidor. |
| `STRIPE_SECRET_KEY` | Secreta | Clave de Stripe Sandbox/Test usada en servidor. |
| `STRIPE_PRICE_PLUS_MONTHLY` | Servidor | ID del precio mensual de Plus. |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Servidor | ID del precio mensual de Premium. |
| `STRIPE_WEBHOOK_SECRET` | Secreta | Secreto de firma del endpoint de webhooks. |

Nunca añadas `NEXT_PUBLIC_` a una clave secreta y nunca subas `.env.local` al repositorio.

## Configuración de Supabase

### 1. Crear el proyecto

Crea un proyecto y copia:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Secret key → `SUPABASE_SECRET_KEY`

La clave secreta solo debe utilizarse en el backend.

### 2. Ejecutar las migraciones

En un proyecto nuevo, ejecuta todos los archivos de `supabase/migrations` en orden cronológico, desde el nombre de archivo más antiguo hasta el más reciente.

Las migraciones crean y endurecen progresivamente:

- `public.profiles`
- `public.subscriptions`
- `public.stripe_webhook_events`
- Restricciones de planes y estados
- Row Level Security y permisos
- Funciones RPC de facturación
- Protección del ciclo de suscripción
- Eliminación de cuentas
- Onboarding

No modifiques una migración que ya se haya aplicado en un entorno compartido. Añade una migración nueva.

### 3. Configurar Google OAuth

En Google Cloud:

1. Crea un cliente OAuth de tipo Web application.
2. Añade como orígenes autorizados:
   - `http://localhost:3000`
   - El dominio de producción.
3. En Authorized redirect URIs, añade la URL de callback que aparece en el proveedor Google del panel de Supabase.

En Supabase:

1. Abre Authentication → Providers → Google.
2. Activa Google e introduce el Client ID y Client Secret.
3. Configura la Site URL de producción.
4. Añade a la lista de redirecciones permitidas:
   - `http://localhost:3000/auth/callback`
   - `https://TU_DOMINIO/auth/callback`

El código intercambia el código OAuth en `src/app/auth/callback/route.ts`.

## Configuración de Stripe Sandbox

Trabaja primero exclusivamente en modo Sandbox/Test.

### 1. Productos y precios

Crea dos precios recurrentes mensuales en EUR:

| Plan | Importe |
|---|---:|
| Plus | 4,99 €/mes |
| Premium | 19,99 €/mes |

Guarda sus IDs `price_...` en:

- `STRIPE_PRICE_PLUS_MONTHLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`

La aplicación valida que ambos precios:

- Estén activos.
- Sean recurrentes mensuales.
- Utilicen EUR.
- Tengan los importes esperados.
- No compartan el mismo ID.

### 2. Clave secreta

Copia una clave `sk_test_...` en `STRIPE_SECRET_KEY`.

No utilices una clave live durante el desarrollo inicial.

### 3. Customer Portal

Configura el portal para permitir, según las necesidades del producto:

- Actualizar el método de pago.
- Consultar facturas.
- Cambiar entre Plus y Premium.
- Cancelar la suscripción.

### 4. Webhook

En producción registra:

```text
https://TU_DOMINIO/api/stripe/webhook
```

Selecciona estos eventos:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
invoice.paid
invoice.payment_failed
```

Copia el secreto `whsec_...` del endpoint en `STRIPE_WEBHOOK_SECRET`.

El webhook verifica el cuerpo original y la cabecera `Stripe-Signature`, consulta el estado actual en Stripe y sincroniza Supabase mediante una RPC idempotente.

### Webhook local opcional

Con Stripe CLI instalado:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Para esa sesión local utiliza el `whsec_...` que devuelve Stripe CLI.

## Política de acceso de facturación

La política genérica actual es:

| Estado Stripe | Acceso de pago | Nueva compra |
|---|---|---|
| `active` | Sí | Bloqueada |
| `trialing` | Sí | Bloqueada |
| `past_due` | Sí, durante recuperación | Bloqueada |
| `incomplete` | No | Bloqueada; revisar facturación |
| `unpaid` | No | Bloqueada; revisar facturación |
| `paused` | No | Bloqueada; revisar facturación |
| `incomplete_expired` | No | Permitida |
| `canceled` | No | Permitida |

La base de datos considera Free cualquier estado que no sea `active`, `trialing` o `past_due`.

## Catálogo y protección por plan

La fuente de verdad está en:

```text
src/config/plans.ts
```

Incluye tipos, etiquetas, precios esperados y jerarquía.

Comprobación sin redirección:

```ts
const access = await getCurrentPlanAccess("plus");
```

Protección de una página o Server Action:

```ts
const profile = await requireMinimumPlan("premium");
```

No se han asignado capacidades de negocio concretas a los planes. Cada producto debe definirlas según su dominio.

## Temas

Configura `APP_THEME` con uno de estos valores:

```text
midnight
light
violet
forest
```

El sistema usa variables semánticas y `data-theme`, por lo que una pantalla nueva debe utilizar utilidades como:

```text
bg-app-page
bg-app-surface-subtle
text-app-text
text-app-text-muted
border-app-border
bg-app-accent
text-app-accent-text
```

Evita introducir colores literales específicos en componentes reutilizables.

Después de cambiar `APP_THEME`, reinicia el servidor de desarrollo.

## Onboarding

Los usuarios existentes al aplicar la migración se consideran incorporados.

Los usuarios nuevos reciben:

```text
onboarding_completed_at = null
```

El dashboard muestra una bienvenida hasta que la RPC autenticada registra la fecha de finalización.

## Eliminación de cuenta

La zona de riesgo de Configuración exige escribir `ELIMINAR`.

El flujo:

1. Elimina el cliente de Stripe y cancela su facturación.
2. Elimina el usuario de Supabase Auth con la clave administrativa.
3. PostgreSQL elimina en cascada el perfil y la suscripción.
4. Se limpia la sesión local.
5. Se redirige a `/account-deleted`.

Este flujo no elimina ni modifica la cuenta de Google del usuario.

## Scripts

Desarrollo:

```powershell
npm run dev
```

Pruebas unitarias:

```powershell
npm test
```

Lint:

```powershell
npm run lint
```

Build de producción:

```powershell
npm run build
```

Servidor de producción local:

```powershell
npm run start
```

Antes de cada commit importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Añade todas las variables de `.env.example` en Project Settings → Environment Variables.
3. Utiliza valores de Sandbox/Test mientras validas la plantilla.
4. Despliega.
5. Añade el dominio de Vercel a las redirecciones permitidas de Supabase.
6. Añade el dominio como origen autorizado en Google OAuth.
7. Registra el endpoint de Stripe:
   `https://TU_DOMINIO/api/stripe/webhook`
8. Guarda su secreto de firma en Vercel.
9. Vuelve a desplegar después de cambiar variables de entorno.

## Arquitectura relevante

```text
src/app/api/stripe/webhook/route.ts
src/app/(app)/settings/actions.ts
src/lib/stripe/server.ts
src/lib/billing/current-subscription.ts
src/lib/billing/subscription-status.ts
src/config/plans.ts
src/config/theme.ts
src/lib/auth/current-profile.ts
src/lib/auth/plan-access.ts
supabase/migrations/
```

## Checklist de producción

Antes de cambiar a Stripe live:

- Sustituir todas las claves y precios de prueba por valores live.
- Crear un endpoint webhook live y guardar su secreto independiente.
- Repetir pruebas de Checkout, portal, cancelación y pago fallido.
- Revisar las políticas de recuperación y reintentos de Stripe.
- Configurar dominio definitivo y redirects exactos.
- Revisar permisos, RLS y claves administrativas.
- Añadir observabilidad y alertas para errores de webhook.
- Definir copias de seguridad y política de conservación.
- Sustituir contenido de demostración del dashboard.
- Definir capacidades reales de Free, Plus y Premium.
- Completar aviso legal, privacidad, cookies y condiciones según el país y el negocio.
- Añadir correo transaccional y soporte si el producto lo necesita.
- Ejecutar pruebas, lint y build desde un entorno limpio.

## Estado actual

La plantilla cubre la infraestructura SaaS principal y está preparada para personalizar:

- Marca y textos.
- Tema.
- Capacidades de cada plan.
- Funcionalidad de negocio.
- Contenido legal.
- Observabilidad y operaciones.

No se considera asesoramiento legal, fiscal ni de cumplimiento.

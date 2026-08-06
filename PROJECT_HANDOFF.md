# PROJECT_HANDOFF — plantilla-saas

> Documento de traspaso para continuar el proyecto en chats nuevos.
>
> **Regla de autoridad:** Git y el `PROJECT_SNAPSHOT_<commit>.txt` cuyo nombre contenga el commit más reciente son la fuente de verdad del código. Este documento explica decisiones, arquitectura, pruebas y convenciones, pero no sustituye al repositorio ni al snapshot.
>
> **Última actualización:** 2026-08-06  
> **Último commit confirmado antes de crear este documento:** `dd9c4f3` — `Add legal placeholders and security headers`  
> **Estado confirmado:** rama `main`, sincronizada con `origin/main`, working tree limpio.  
> **Etiqueta `v1.0.0`:** fue recomendada, pero no está confirmado que se haya creado. Verificar con Git antes de asumir que existe.

---

## 1. Objetivo del proyecto

`plantilla-saas` es una base técnica reutilizable para construir distintos negocios SaaS sin repetir la infraestructura común.

La plantilla ya cubre:

- Landing pública.
- Autenticación con Google.
- Sesiones SSR.
- Rutas privadas.
- Perfiles en PostgreSQL.
- Row Level Security.
- Planes Free, Plus y Premium.
- Stripe Checkout.
- Customer Portal.
- Webhooks firmados e idempotentes.
- Sincronización del ciclo de suscripción.
- Recuperación de pagos fallidos.
- Cancelación y resuscripción.
- Protección genérica por plan mínimo.
- Onboarding.
- Eliminación segura de cuenta.
- Temas visuales.
- Documentación de instalación.
- Páginas legales provisionales.
- Cabeceras de seguridad.
- `robots.txt` y `sitemap.xml`.
- Pruebas unitarias básicas.
- Despliegue en Vercel.

La plantilla está terminada como **infraestructura SaaS general**. El siguiente trabajo debe consistir en implantar una idea de negocio concreta sobre esta base, no en reconstruir autenticación, pagos o arquitectura general sin una razón técnica explícita.


---

## 2. Repositorio, rama y despliegue

### Entorno local

```text
C:\dev\plantilla-saas
```

### Repositorio

```text
Repositorio privado de GitHub: AlvaroLominchar/plantilla-saas
Rama principal: main
Remoto: origin
```

### Producción

```text
https://plantilla-saas.vercel.app
```

La rama `main` está conectada a Vercel. Un `git push` a `main` inicia normalmente un nuevo despliegue.

No realizar despliegues manuales salvo que exista un motivo concreto.

### Primeros comandos de cualquier nueva sesión técnica

Antes de modificar código:

```powershell
git status; git log --oneline -5
```

Después, revisar:

1. `PROJECT_HANDOFF.md`.
2. El `PROJECT_SNAPSHOT_<commit>.txt` más reciente disponible.
3. `README.md`.
4. Los archivos concretos implicados en la funcionalidad.

Si Git, el snapshot y este documento discrepan, prevalecen Git y el snapshot más reciente.


---

## 3. Forma de trabajo obligatoria

- Responder siempre en español.
- El usuario trabaja con Windows, PowerShell y VS Code.
- Todos los comandos de terminal deben escribirse completos en una sola línea.
- Avanzar en bloques pequeños y verificables.
- No asumir que una prueba funciona hasta que el usuario lo confirme.
- Para cambios importantes, entregar archivos completos o un ZIP, no fragmentos ambiguos.
- Indicar siempre la ruta exacta de cada archivo.
- Explicar dónde extraer un ZIP y qué archivos sustituye o añade.
- Indicar cuándo guardar, reiniciar el servidor y validar.
- No cambiar de stack ni añadir herramientas innecesarias sin justificarlo.
- No ejecutar ni recomendar comandos destructivos sin explicar sus efectos.
- No solicitar ni mostrar secretos, tokens, claves, correos personales, UUID privados ni el contenido de `.env.local`.
- Nunca incluir claves secretas en código.
- Nunca usar prefijo `NEXT_PUBLIC_` para secretos.
- Stripe debe permanecer en Sandbox/Test hasta que se decida explícitamente un lanzamiento real.
- No inventar capacidades comerciales para Free, Plus o Premium.
- Mantener la arquitectura de Next.js, Supabase, Stripe, planes, onboarding, temas y eliminación de cuentas salvo razón técnica explícita.

Después de cada bloque importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

Solo después de la validación del usuario:

```powershell
git add ...; git commit -m "Mensaje descriptivo"; git push; git status
```


---

## 4. Stack y versiones confirmadas

### Entorno del usuario

- Windows.
- PowerShell.
- VS Code.
- Node.js `24.18.1`.
- npm `11.16.0`.
- Git `2.55.0.windows.3`.

### Aplicación

- Next.js `16.2.12`.
- React `19.2.4`.
- React DOM `19.2.4`.
- TypeScript.
- App Router.
- Carpeta `src`.
- Tailwind CSS 4.
- Supabase:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
- Stripe SDK.
- Vitest.
- Vercel.
- Gestor de paquetes: npm.

### Scripts

```text
npm run dev
npm test
npm run lint
npm run build
npm run start
```


---

## 5. Rutas actuales

### Públicas

```text
/
/login
/legal
/privacy
/terms
/cookies
/robots.txt
/sitemap.xml
/account-deleted
/auth/auth-code-error
/auth/callback
/auth/signout
/api/stripe/webhook
```

### Privadas

```text
/dashboard
/settings
```

### Último build confirmado

El build del commit `dd9c4f3` generó 18 rutas y finalizó correctamente.

Las rutas privadas se renderizan dinámicamente y requieren sesión válida.


---

## 6. Autenticación y sesiones

### Proveedor

- Google OAuth mediante Supabase Auth.
- La aplicación OAuth se configuró para localhost y el dominio de Vercel.
- Supabase tiene configuradas la Site URL y las redirect URLs.
- El Client ID y el Client Secret de Google viven en la configuración del proveedor; nunca deben pedirse ni exponerse.

### Flujo confirmado

- Acceso con Google.
- Callback OAuth.
- Intercambio de código por sesión.
- Creación del usuario en Supabase Auth.
- Creación automática del perfil.
- Persistencia de sesión.
- Logout.
- Redirecciones de rutas protegidas.
- Usuario autenticado en `/login` redirigido al dashboard.
- Usuario no autenticado redirigido a `/login` al abrir rutas privadas.

### Archivos principales

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/proxy.ts
src/lib/supabase/admin.ts
src/proxy.ts
src/app/auth/callback/route.ts
src/app/auth/signout/route.ts
src/components/auth/google-sign-in-button.tsx
src/app/login/page.tsx
src/app/(app)/layout.tsx
```

### Decisiones de seguridad

- El navegador y SSR normal usan la URL y la clave publicable de Supabase.
- Las operaciones administrativas usan un cliente aislado de servidor.
- Las Server Actions sensibles validan el usuario mediante Supabase.
- El callback solo acepta rutas `next` internas seguras.
- `.env.local` está ignorado por Git.


---

## 7. Perfil y base de datos

### Tabla `public.profiles`

Responsabilidades principales:

- Relación uno a uno con `auth.users`.
- Nombre visible.
- Avatar.
- Plan actual.
- Estado de onboarding.
- Fechas de creación y actualización.
- Eliminación en cascada al borrar el usuario de Auth.

### Comportamiento confirmado

- El perfil se crea automáticamente al registrarse.
- Nombre y avatar se inicializan desde los metadatos de Google.
- El email o un valor genérico actúan como fallback.
- El usuario puede consultar su propio perfil.
- El usuario puede modificar únicamente los campos autorizados de perfil.
- El usuario no puede elevar su propio plan.
- Otro usuario no puede leer el perfil ajeno.
- `updated_at` se actualiza automáticamente.

### Archivos principales

```text
src/lib/auth/user-profile.ts
src/lib/auth/current-profile.ts
src/components/app/user-avatar.tsx
src/components/app/profile-form.tsx
src/app/(app)/settings/actions.ts
```

### Fuente de verdad del plan

El plan visible no se obtiene de parámetros del navegador. Se consulta desde la base de datos y se normaliza mediante el catálogo central de planes.


---

## 8. Catálogo de planes

### Planes válidos

```text
free
plus
premium
```

### Fuente de verdad

```text
src/config/plans.ts
```

Incluye:

- `ACCOUNT_PLANS`
- `AccountPlan`
- `PAID_PLANS`
- `PaidPlan`
- `PLAN_CATALOG`
- Validadores y normalizadores.
- Etiquetas.
- Precios alternativos visibles.
- Importes mensuales esperados.
- Jerarquía de acceso.
- `hasMinimumPlan`.

### Importes técnicos actualmente esperados

```text
Plus: 499 céntimos EUR al mes
Premium: 1999 céntimos EUR al mes
```

Estos importes forman parte de la configuración actual de la plantilla, pero las capacidades comerciales de cada plan todavía no están definidas.

### Protección genérica por plan

```text
src/lib/auth/plan-access.ts
```

Funciones:

- `getCurrentPlanAccess(requiredPlan)`
- `requireMinimumPlan(requiredPlan)`

No asignar funciones concretas del futuro negocio a un plan hasta definir la propuesta comercial.


---

## 9. Stripe y facturación

### Entorno

- Únicamente Sandbox/Test.
- No activar Stripe Live ni pedir datos bancarios sin una decisión explícita.
- No utilizar claves `sk_live_`.
- Los IDs de precio se configuran en variables de entorno.
- El navegador nunca puede elegir un `priceId` arbitrario.

### Funciones implementadas

- Stripe Checkout alojado.
- Plan Plus mensual.
- Plan Premium mensual.
- Reutilización del cliente de Stripe cuando existe.
- Customer Portal.
- Actualización del método de pago.
- Cambio de plan desde el portal.
- Cancelación programada.
- Cancelación definitiva.
- Resuscripción después de cancelar.
- Webhook verificado.
- Idempotencia.
- Consulta del estado actual en Stripe antes de sincronizar.
- Protección frente a eventos antiguos de suscripciones anteriores.
- Recuperación de pagos fallidos.
- Tratamiento de estados no recuperables.
- Eliminación del cliente de Stripe al borrar una cuenta.

### Archivos principales

```text
src/lib/stripe/server.ts
src/app/(app)/settings/actions.ts
src/app/(app)/settings/page.tsx
src/app/api/stripe/webhook/route.ts
src/lib/billing/current-subscription.ts
src/lib/billing/subscription-status.ts
src/config/plans.ts
```

### Reglas de Checkout

- Requiere usuario autenticado.
- El plan solicitado se valida contra `PaidPlan`.
- El servidor selecciona el precio permitido.
- No se acepta un ID de precio enviado por el navegador.
- Se asocia la sesión con el UUID del usuario mediante referencias y metadata.
- Se reutiliza el cliente existente cuando corresponde.
- No se crea una nueva sesión cuando existe un estado que bloquea Checkout.
- El retorno visual de Checkout no cambia por sí mismo el plan.
- El plan se sincroniza mediante el webhook verificado.


---

## 10. Política de estados de suscripción

### Estados con acceso de pago

```text
active
trialing
past_due
```

`past_due` conserva temporalmente el acceso durante la recuperación del cobro.

### Estados sin acceso de pago

```text
incomplete
incomplete_expired
unpaid
paused
canceled
```

La base de datos degrada el perfil a `free` cuando el estado actual no debe conservar acceso de pago.

### Estados que bloquean una compra nueva

```text
incomplete
trialing
active
past_due
unpaid
paused
```

### Estados que permiten volver a iniciar Checkout

```text
incomplete_expired
canceled
```

Los estados desconocidos o la indisponibilidad de datos deben tratarse con prudencia en la interfaz. No permitir acciones inseguras cuando no se puede verificar el estado real.

### Estados que requieren atención de facturación

```text
incomplete
past_due
unpaid
paused
```

### Etiquetas de interfaz

La política y las etiquetas están centralizadas en:

```text
src/lib/billing/subscription-status.ts
```

La cancelación programada tiene prioridad visual sobre la etiqueta normal de una suscripción activa.


---

## 11. Webhooks y sincronización

### Endpoint

```text
/api/stripe/webhook
```

### Principios

- Lee el cuerpo original de la petición.
- Verifica `Stripe-Signature`.
- Usa `STRIPE_WEBHOOK_SECRET`.
- No confía únicamente en el payload recibido.
- Consulta el estado actual en Stripe cuando corresponde.
- Registra eventos para idempotencia.
- Mantiene una suscripción actual por usuario.
- Evita que eventos antiguos sustituyan una suscripción nueva.
- Tolera el webhook de cancelación posterior a la eliminación del cliente y del usuario.

### Eventos configurados o documentados

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

Verificar siempre el snapshot y la configuración actual de Stripe antes de añadir o eliminar eventos.


---

## 12. Tablas y migraciones de Supabase

### Tablas principales

```text
public.profiles
public.subscriptions
public.stripe_webhook_events
```

### Reglas generales

- Ejecutar las migraciones de `supabase/migrations` en orden cronológico.
- No modificar una migración ya aplicada en un entorno compartido.
- Crear una migración nueva para cualquier cambio.
- Mantener RLS y permisos mínimos.
- No exponer operaciones administrativas al cliente.
- Las relaciones con `auth.users` deben conservar las cascadas previstas.

### Migraciones críticas confirmadas

```text
20260802193000_create_profiles.sql
20260803130000_add_plus_and_premium_plans.sql
20260803173000_add_flexible_subscription_cancel_at.sql
20260803223000_remove_legacy_pro_compatibility.sql
20260805184500_harden_subscription_lifecycle.sql
20260805190000_remove_subscription_lifecycle_compatibility.sql
20260805204500_support_account_deletion_webhooks.sql
20260805213000_add_profile_onboarding.sql
```

La lista exacta y completa debe leerse del snapshot o del directorio real.

### Última migración confirmada

```text
supabase/migrations/20260805213000_add_profile_onboarding.sql
```


---

## 13. Onboarding

### Comportamiento

- Los usuarios que ya existían al aplicar la migración se marcaron como incorporados.
- Los usuarios nuevos se crean con onboarding pendiente.
- El dashboard muestra una tarjeta de bienvenida genérica.
- El botón de finalización ejecuta una RPC autenticada.
- Se guarda `onboarding_completed_at`.
- La tarjeta desaparece y no vuelve tras recargar.

### Archivos principales

```text
src/app/(app)/dashboard/actions.ts
src/app/(app)/dashboard/page.tsx
src/components/app/onboarding-card.tsx
src/lib/auth/current-profile.ts
supabase/migrations/20260805213000_add_profile_onboarding.sql
```

### Prueba manual confirmada

- La bienvenida apareció para una cuenta recién recreada.
- Se completó correctamente.
- Desapareció.
- No reapareció tras recargar.
- Supabase guardó una fecha no nula.


---

## 14. Eliminación de cuenta

### Interfaz

- Zona de riesgo en Configuración.
- El usuario debe escribir exactamente `ELIMINAR`.
- El botón permanece desactivado hasta cumplir la confirmación.

### Flujo de servidor

1. Validar la confirmación.
2. Validar el usuario autenticado.
3. Consultar el cliente de Stripe.
4. Eliminar el cliente de Stripe cuando existe.
5. Tolerar `resource_missing` si ya no existe.
6. Eliminar el usuario mediante Supabase Admin.
7. Dejar que las claves foráneas eliminen perfil y suscripción en cascada.
8. Limpiar la sesión local.
9. Redirigir a `/account-deleted`.

### Seguridad del webhook tras borrar la cuenta

La migración de soporte de eliminación permite ignorar de forma segura el webhook final de cancelación cuando el perfil ya no existe, sin debilitar el comportamiento para otros estados.

### Archivos principales

```text
src/components/app/delete-account-form.tsx
src/app/(app)/settings/actions.ts
src/app/account-deleted/page.tsx
src/lib/stripe/server.ts
src/app/api/stripe/webhook/route.ts
supabase/migrations/20260805204500_support_account_deletion_webhooks.sql
```

### Prueba manual confirmada

Para una cuenta Free desechable:

- Usuario de Auth eliminado.
- Perfil eliminado.
- Suscripción asociada inexistente o eliminada.
- Sesión cerrada.
- `/dashboard` volvió a requerir login.
- La cuenta de Google no fue eliminada ni modificada.


---

## 15. Temas y diseño

### Presets

```text
midnight
light
violet
forest
```

### Variable

```text
APP_THEME
```

### Fuente de verdad

```text
src/config/theme.ts
```

### Principios de diseño

- Utilizar tokens y clases semánticas.
- Evitar colores literales en componentes reutilizables.
- Mantener diseño limpio, sobrio y responsive.
- El tema predeterminado confirmado es `midnight`.
- Después de cambiar `APP_THEME`, reiniciar el servidor local.

### Ejemplos de utilidades semánticas

```text
bg-app-page
bg-app-page-soft
bg-app-surface-subtle
bg-app-surface-active
text-app-text
text-app-text-soft
text-app-text-muted
border-app-border
bg-app-accent
text-app-accent-text
```


---

## 16. Landing, dashboard y contenido provisional

### Landing

Describe la infraestructura general de la plantilla:

- Autenticación.
- Pagos.
- Datos por usuario.
- Diseño reutilizable.
- Planes Free, Plus y Premium.

### Dashboard

El dashboard actual contiene métricas, proyectos y gráficos de demostración.

Estos elementos son **placeholders visuales** y deben reemplazarse por la funcionalidad y los datos reales del negocio.

### Botones provisionales

Algunas acciones de demostración, como `Nuevo proyecto`, permanecen desactivadas hasta que una idea concreta defina su comportamiento.

No interpretar el contenido de demostración como una funcionalidad implementada.


---

## 17. Páginas legales

### Rutas

```text
/legal
/privacy
/terms
/cookies
```

### Estado

- Son documentos provisionales.
- Contienen campos entre corchetes.
- No deben considerarse textos legales definitivos.
- Deben adaptarse al negocio, titular, clientes, país, datos tratados, precios, reembolsos, comunicaciones y proveedores.

### Enlaces

- Footer público.
- Pantalla de login.
- Navegación entre documentos.

### Archivos principales

```text
src/components/legal/legal-document.tsx
src/app/legal/page.tsx
src/app/privacy/page.tsx
src/app/terms/page.tsx
src/app/cookies/page.tsx
src/components/landing/site-footer.tsx
```

### Cookies actuales

La plantilla utiliza cookies técnicas necesarias para autenticación y sesión.

No se ha confirmado la integración de analítica, publicidad, píxeles ni cookies no esenciales.


---

## 18. Seguridad HTTP, robots y sitemap

### Cabeceras confirmadas en producción

- `Content-Security-Policy`.
- `Referrer-Policy`.
- `X-Content-Type-Options`.
- `X-Frame-Options`.
- `Permissions-Policy`.
- `Cross-Origin-Opener-Policy`.
- `Cross-Origin-Resource-Policy`.
- `Strict-Transport-Security`.

### CSP

- En desarrollo permite `'unsafe-eval'` por necesidades de Next.js.
- En producción se confirmó que `'unsafe-eval'` no aparece.
- Conserva orígenes necesarios para Supabase, Google y Stripe.
- Debe revisarse al añadir nuevos scripts, analítica, imágenes, fuentes, iframes o proveedores.

### Robots

`robots.txt` permite la web pública y bloquea:

```text
/api/
/auth/
/dashboard
/login
/settings
/account-deleted
```

### Sitemap

Incluye:

```text
/
/legal
/privacy
/terms
/cookies
```

### URL canónica

```text
NEXT_PUBLIC_SITE_URL
```

En producción quedó configurada como:

```text
https://plantilla-saas.vercel.app
```


---

## 19. Variables de entorno

Solo se documentan nombres. Nunca copiar valores reales a chats, archivos compartidos ni commits.

### Configurables

```text
APP_THEME
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_PRICE_PLUS_MONTHLY
STRIPE_PRICE_PREMIUM_MONTHLY
STRIPE_WEBHOOK_SECRET
```

### Variables automáticas utilizadas cuando existen

```text
NODE_ENV
VERCEL_PROJECT_PRODUCTION_URL
VERCEL_URL
```

### Reglas

- `.env.local` no se versiona.
- `.env.example` sí se versiona.
- Las claves secretas no llevan `NEXT_PUBLIC_`.
- Tras cambiar variables de Vercel, realizar un nuevo despliegue.
- No abrir ni pegar `.env.local` en el chat.


---

## 20. Pruebas

### Automatizadas

Vitest está configurado con:

```text
src/config/plans.test.ts
src/lib/billing/subscription-status.test.ts
```

Último resultado confirmado:

```text
2 archivos superados
34 pruebas superadas
```

Cubren:

- Orden de planes.
- Validación y normalización.
- Planes de pago.
- Etiquetas.
- Precios visibles alternativos.
- Importes esperados.
- Jerarquía de acceso.
- Estados que bloquean Checkout.
- Estados que requieren atención.
- Etiquetas de suscripción.
- Cancelación programada.

### Manuales confirmadas

- Google OAuth.
- Sesión y logout.
- Protección de rutas.
- Edición de perfil.
- Checkout Plus.
- Checkout Premium.
- Webhook.
- Sincronización del plan.
- Customer Portal.
- Cancelación programada.
- Cancelación definitiva.
- Resuscripción con una suscripción nueva.
- Protección frente a eventos de suscripción anterior.
- Pago fallido con tarjeta de prueba.
- Estado `past_due`.
- Recuperación del pago.
- Onboarding.
- Eliminación de cuenta.
- Vercel.
- Cabeceras de seguridad.
- `robots.txt`.
- `sitemap.xml`.

### Última validación completa confirmada

```text
npm test: correcto
npm run lint: correcto
npm run build: correcto
git diff --check: correcto
git status: limpio
```


---

## 21. Archivos de referencia principales

### Configuración

```text
package.json
README.md
.env.example
next.config.ts
tsconfig.json
src/config/plans.ts
src/config/theme.ts
src/lib/site-url.ts
```

### Autenticación y perfil

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/proxy.ts
src/lib/supabase/admin.ts
src/lib/auth/user-profile.ts
src/lib/auth/current-profile.ts
src/lib/auth/plan-access.ts
src/proxy.ts
```

### Stripe y facturación

```text
src/lib/stripe/server.ts
src/lib/billing/current-subscription.ts
src/lib/billing/subscription-status.ts
src/app/api/stripe/webhook/route.ts
src/app/(app)/settings/actions.ts
src/app/(app)/settings/page.tsx
```

### Onboarding

```text
src/app/(app)/dashboard/actions.ts
src/app/(app)/dashboard/page.tsx
src/components/app/onboarding-card.tsx
```

### Eliminación

```text
src/components/app/delete-account-form.tsx
src/app/account-deleted/page.tsx
```

### Legal y seguridad

```text
src/components/legal/legal-document.tsx
src/app/legal/page.tsx
src/app/privacy/page.tsx
src/app/terms/page.tsx
src/app/cookies/page.tsx
src/app/robots.ts
src/app/sitemap.ts
next.config.ts
```

### Base de datos

```text
supabase/migrations/
```


---

## 22. Elementos deliberadamente pendientes

La plantilla técnica está terminada, pero no el negocio que se construirá sobre ella.

Pendiente de definir para cada idea:

- Problema concreto.
- Usuario objetivo.
- Propuesta de valor.
- Flujo principal.
- Entidades y datos propios del producto.
- Dashboard real.
- Funcionalidades del negocio.
- Capacidades de Free, Plus y Premium.
- Límites de uso.
- Precios finales.
- Política de pruebas gratuitas.
- Cancelaciones y reembolsos comerciales.
- Identidad visual y textos.
- Dominio definitivo.
- Textos legales definitivos.
- Analítica.
- Emails transaccionales.
- Soporte.
- Observabilidad y alertas.
- Copias de seguridad y conservación.
- Stripe Live.
- Publicación o verificación definitiva de Google OAuth cuando proceda.
- Pruebas end-to-end adicionales si el producto las necesita.

No implementar estas decisiones por intuición. Primero deben definirse con el usuario.


---

## 23. Riesgos y precauciones

- No modificar la política de facturación sin revisar pruebas y migraciones.
- No actualizar `profiles.plan` directamente desde el cliente.
- No confiar en el retorno de Checkout como confirmación de pago.
- No aceptar IDs de precio enviados libremente por el navegador.
- No debilitar RLS.
- No usar el cliente administrativo de Supabase en código de cliente.
- No exponer claves secretas.
- No eliminar la protección frente a eventos antiguos de Stripe.
- No romper la tolerancia del webhook tras eliminar cuentas.
- No introducir nuevas cookies no esenciales sin revisar información y consentimiento.
- No publicar los documentos legales mientras conserven placeholders.
- No asumir que una etiqueta Git recomendada llegó a crearse.
- No interpretar mojibake mostrado por PowerShell como corrupción real sin comprobar el archivo UTF-8 en VS Code o el navegador.
- No editar una migración ya aplicada; crear otra.


---

## 24. Procedimiento para implantar una idea de negocio

Antes de programar:

1. Explicar la idea.
2. Identificar usuario y problema.
3. Definir el resultado principal.
4. Diseñar el flujo mínimo.
5. Definir entidades y permisos.
6. Decidir qué parte es pública y cuál privada.
7. Definir, solo entonces, las capacidades de cada plan.
8. Revisar impacto en datos, Stripe, onboarding, eliminación y textos legales.
9. Proponer un primer bloque pequeño.
10. Implementar y validar sin alterar innecesariamente la infraestructura existente.

La primera implementación debe priorizar un producto mínimo que pueda probarse con usuarios, no una arquitectura especulativa.


---

## 25. Comprobación inicial para un chat nuevo

El primer mensaje del chat nuevo debe pedir que revise:

1. Instrucciones del proyecto.
2. `PROJECT_HANDOFF.md`.
3. El `PROJECT_SNAPSHOT_<commit>.txt` más reciente.
4. `README.md`.

Antes de escribir código, el nuevo chat debe confirmar:

- Commit del snapshot revisado.
- Stack.
- Funciones ya terminadas.
- Última migración.
- Número de pruebas.
- Elementos provisionales.
- Convenciones de trabajo.

Después se explica la idea de negocio.


---

## 26. Estado de cierre de la plantilla

Último estado confirmado antes de crear este handoff:

```text
Commit: dd9c4f3
Mensaje: Add legal placeholders and security headers
Rama: main
Remoto: origin/main
Working tree: clean
Producción: operativa
Pruebas: 34/34
Lint: correcto
Build: correcto
Vercel: HTTP 200
CSP de producción: correcta y sin unsafe-eval
HSTS: activo
robots.txt: correcto
sitemap.xml: correcto
```

La plantilla puede considerarse **v1 técnica completa**, aunque la creación de una etiqueta Git `v1.0.0` debe comprobarse antes de afirmarla.


---

## 27. Fuente de verdad y mantenimiento del handoff

Cuando se cierre un bloque importante:

1. Ejecutar pruebas, lint, build y `git diff --check`.
2. Hacer commit y push tras confirmación.
3. Actualizar este documento cuando cambien decisiones, arquitectura o pruebas.
4. Generar un snapshot nuevo cuyo nombre contenga el nuevo commit.
5. Subir al proyecto únicamente el snapshot más reciente.
6. Retirar snapshots antiguos de las fuentes para evitar contradicciones.

Ejemplo:

```text
PROJECT_SNAPSHOT_ab12cd3.txt
```

El nombre del snapshot debe contener siempre el hash corto real del commit.

---

**Fin de `PROJECT_HANDOFF.md`.**

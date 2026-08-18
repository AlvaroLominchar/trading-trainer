# PROJECT_HANDOFF — trading-trainer

> Documento técnico de traspaso para continuar el producto en chats nuevos.
>
> **Regla de autoridad:** Git y el `PROJECT_SNAPSHOT_<commit>.txt` cuyo nombre contenga el commit más reciente son la fuente de verdad del código. Este documento resume decisiones, arquitectura, validaciones y siguiente bloque, pero no debe utilizarse para inferir el hash actual si existe un snapshot más reciente.
>
> **Contexto estable de negocio:** `PRODUCT_CONTEXT.md`.
>
> **Origen del producto:** clon aislado de `plantilla-saas` desde el commit `ba997e2`.
> **Rama de trabajo prevista:** `main`.
> **Nombre técnico provisional:** `trading-trainer`.

---

## 1. Objetivo del proyecto

`trading-trainer` es un producto SaaS de entrenamiento de toma de decisiones para traders.

No pretende ser:

- Un proveedor de señales.
- Un sistema de predicción.
- Un broker.
- Una plataforma de copy trading.
- Un servicio de asesoramiento financiero personalizado.
- Un simulador abierto de mercado en su primera versión.

El concepto central es un **gimnasio de decisiones** mediante escenarios históricos o controlados:

```text
Analizar → decidir → gestionar → revelar → aprender → repetir
```

La experiencia debe ser visual, fluida, medible y adecuada para sesiones cortas.

La definición estable del negocio, límites regulatorios, principios de producto, roadmap conceptual y estrategia de datos viven en:

```text
PRODUCT_CONTEXT.md
```

---

## 2. Origen técnico

El producto se creó clonando la plantilla SaaS reutilizable:

```text
Repositorio original: AlvaroLominchar/plantilla-saas
Commit base heredado: ba997e2
```

La copia local de desarrollo se creó en:

```text
C:\dev\trading-trainer
```

Tras clonar, se eliminó el remoto de la plantilla para impedir cualquier `push` accidental al repositorio original.

La historia heredada contiene la etiqueta:

```text
v1.0.0
```

en el commit:

```text
dd9c4f3
```

Esa etiqueta pertenece a la plantilla original y no representa una versión del nuevo producto.

Para conocer el commit, remoto y estado exactos actuales, revisar siempre:

```powershell
git status; git log --oneline -5; git remote -v
```

y el snapshot más reciente disponible.

---

## 3. Arquitectura heredada que debe conservarse

Salvo razón técnica explícita, el producto conserva:

- Next.js `16.2.12`.
- React `19.2.4`.
- TypeScript.
- App Router.
- Carpeta `src`.
- Tailwind CSS 4.
- Supabase Auth.
- Sesiones SSR.
- Google OAuth.
- PostgreSQL.
- Row Level Security.
- Perfiles.
- Planes `free`, `plus` y `premium`.
- Protección genérica por plan.
- Stripe Checkout.
- Customer Portal.
- Webhooks firmados e idempotentes.
- Sincronización del ciclo de suscripción.
- Recuperación de pagos fallidos.
- Cancelación y resuscripción.
- Onboarding.
- Eliminación segura de cuenta.
- Temas semánticos.
- Páginas legales provisionales.
- Cabeceras de seguridad.
- `robots.txt`.
- `sitemap.xml`.
- Vitest.
- Vercel como despliegue previsto.

No reconstruir infraestructura ya resuelta por rutina.

---

## 4. Estado técnico heredado

### Rutas públicas

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

### Rutas privadas

```text
/dashboard
/settings
```

### Datos

Tablas heredadas principales:

```text
public.profiles
public.subscriptions
public.stripe_webhook_events
```

### Última migración heredada

```text
supabase/migrations/20260805213000_add_profile_onboarding.sql
```

No modificar migraciones heredadas ya aplicadas. Cualquier cambio futuro debe entrar mediante una migración nueva.

---

## 5. Facturación heredada

Planes válidos:

```text
free
plus
premium
```

Fuente de verdad:

```text
src/config/plans.ts
```

Los importes actuales heredados son técnicos y provisionales:

```text
Plus: 4,99 €/mes
Premium: 19,99 €/mes
```

No representan todavía la estrategia comercial de `trading-trainer`.

No asignar capacidades definitivas a Free, Plus o Premium hasta validar qué funciones aportan valor.

Stripe debe permanecer en Sandbox/Test hasta que exista una decisión explícita de lanzamiento real.

---

## 6. Principios técnicos específicos del nuevo producto

### 6.1 Calidad visual continua

No se acumularán grandes bloques funcionales feos para diseñarlos al final.

Cada bloque visible debe cerrar con:

- Responsive real.
- Jerarquía visual clara.
- Estados de carga cuando proceda.
- Estados vacíos cuando proceda.
- Feedback inmediato.
- Interacciones suaves.
- Buen aspecto en capturas y grabaciones.
- Compatibilidad con los tokens semánticos de temas existentes.

### 6.2 Desarrollo independiente de servicios externos

Priorizar primero todo lo que pueda construirse y validarse sin:

- Usuarios externos.
- Datos comerciales.
- APIs de brokers.
- Tiempo real.
- Stripe Live.
- Premios.
- Marketplace.
- Integraciones sociales.

### 6.3 Núcleo determinista

El sistema de ejercicios y puntuación debe ser explicable y testeable.

La IA podrá ayudar posteriormente a:

- Explicar resultados.
- Resumir sesiones.
- Detectar patrones.
- Ayudar al etiquetado.

No debe ser la fuente de verdad del ejercicio.

### 6.4 No mezclar producto con señales

La primera versión debe trabajar con escenarios históricos o sintéticos y evitar recomendaciones actuales de compra o venta.

---

## 7. Estrategia inicial de datos

No utilizar Google Finance como fuente del producto.

Fases previstas:

```text
Desarrollo interno
→ datos sintéticos o controlados

Alpha
→ conjunto pequeño con derechos resueltos

Beta pública
→ proveedor/licencia con permiso comercial y visualización externa

Expansión
→ nuevos mercados solo cuando el uso justifique el coste
```

Mercado inicial previsto:

```text
BTC spot
ETH spot
```

Sin tiempo real y sin derivados en la primera fase.

---

## 8. Primer flujo objetivo del entrenamiento

La primera experiencia completa deberá evolucionar hacia:

1. Mostrar un escenario.
2. Ocultar el futuro.
3. Permitir analizar.
4. Decidir:
   - Largo.
   - Corto.
   - No operar.
5. Declarar confianza.
6. Revelar el movimiento posterior.
7. Evaluar.
8. Explicar.
9. Guardar el intento.
10. Actualizar habilidades.

Más adelante:

- Entrada.
- Invalidación.
- Stop.
- Objetivo.
- Riesgo.
- Gestión vela a vela.
- Modos de presión.
- Entrenamiento adaptativo.

---

## 9. Modelo de datos previsto

Todavía no se ha creado ninguna tabla nueva del negocio.

Entidades candidatas:

```text
exercises
exercise_candles
exercise_skill_tags
exercise_rubrics
exercise_attempts
attempt_decisions
user_skill_scores
daily_challenges
```

La taxonomía y las relaciones deben diseñarse antes de escribir la migración.

No crear estas tablas por intuición.

---

## 10. Dashboard heredado

El dashboard actual contiene únicamente placeholders de la plantilla:

- Métricas de demostración.
- Proyectos ficticios.
- Gráfico ficticio.
- Botón `Nuevo proyecto`.

Deben eliminarse progresivamente y reemplazarse por datos reales del producto.

No interpretar esos elementos como funcionalidad existente.

---

## 11. Onboarding heredado

Actualmente existe un onboarding genérico:

- Usuario nuevo con onboarding pendiente.
- Tarjeta en dashboard.
- RPC autenticada.
- Persistencia en `onboarding_completed_at`.

Debe conservarse la infraestructura y sustituirse el contenido cuando exista el primer flujo real de entrenamiento.

---

## 12. Legal heredado

Rutas:

```text
/legal
/privacy
/terms
/cookies
```

Siguen siendo documentos provisionales con placeholders.

Antes de una beta pública o lanzamiento comercial deberán adaptarse al producto, incluyendo como mínimo:

- Naturaleza educativa/simulada.
- Limitaciones.
- Datos tratados.
- Datos de mercado.
- Proveedores.
- Suscripciones.
- Cancelaciones.
- Uso aceptable.
- Riesgos.
- Jurisdicción.
- Política de cookies.

Además deberá revisarse específicamente el perímetro regulatorio financiero antes de lanzar funcionalidades que puedan aproximarse a recomendaciones o asesoramiento.

---

## 13. Documentos de continuidad

### Contexto estable

```text
PRODUCT_CONTEXT.md
```

Contiene:

- Visión.
- Usuario.
- Propuesta de valor.
- Principios.
- Límites regulatorios.
- Estrategia de datos.
- IA.
- Diseño.
- Modelo de negocio.
- Roadmap conceptual.

### Estado técnico

```text
PROJECT_HANDOFF.md
```

Este archivo.

### Fuente de verdad del código

```text
PROJECT_SNAPSHOT_<commit>.txt
```

El snapshot debe regenerarse al cerrar hitos importantes y antes de migrar a otro chat cuando sea necesario.

---

## 14. Orden de autoridad

Cuando existan discrepancias:

```text
Git / snapshot más reciente
        ↓
PROJECT_HANDOFF.md
        ↓
PRODUCT_CONTEXT.md
        ↓
README.md
        ↓
memoria de conversaciones
```

Git y snapshot gobiernan lo que existe.

`PRODUCT_CONTEXT.md` gobierna la intención del negocio.

---

## 15. Forma de trabajo obligatoria

- Responder siempre en español.
- Entorno del usuario: Windows, PowerShell y VS Code.
- Todos los comandos de terminal deben ir completos en una sola línea.
- Antes de tocar código:
  - revisar `PROJECT_HANDOFF.md`;
  - revisar el snapshot más reciente;
  - revisar `PRODUCT_CONTEXT.md`;
  - revisar `README.md`;
  - revisar los archivos concretos afectados.
- Avanzar en bloques pequeños y verificables.
- Para cambios importantes, entregar archivos completos o ZIP.
- Indicar rutas exactas.
- No pedir ni mostrar secretos.
- No mostrar `.env.local`.
- No cambiar de stack innecesariamente.
- No debilitar RLS.
- No exponer clientes administrativos al navegador.
- No inventar funciones definitivas de planes.
- No asumir que una prueba funciona hasta validarla.

Después de cada bloque importante:

```powershell
npm test; npm run lint; npm run build; git diff --check; git status
```

Solo después de validación del usuario:

```powershell
git add ...; git commit -m "Mensaje descriptivo"; git push; git status
```

---

## 16. Validación fundacional confirmada

En el repositorio independiente se ha confirmado:

```text
Vitest: 34/34 pruebas correctas
Test files: 2/2
Lint: correcto
Build: correcto
Rutas generadas: 18
git diff --check: correcto
```

Durante la instalación inicial `npm audit --omit=dev` detectó una vulnerabilidad alta transitiva:

```text
nanoid 3.3.16
```

arrastrada por:

```text
postcss 8.5.25
```

El rango permitido por PostCSS era:

```text
^3.3.16
```

Se actualizó únicamente la dependencia transitiva a:

```text
nanoid 3.3.18
```

sin modificar `package.json`.

Validación posterior confirmada:

```text
npm audit --omit=dev: 0 vulnerabilidades
Vitest: 34/34
Lint: correcto
Build: correcto
git diff --check: correcto
```

Existe además un aviso de npm sobre un script de instalación no aprobado para:

```text
unrs-resolver@1.12.2
```

No se ha aprobado ni modificado porque no existe actualmente una necesidad funcional que lo justifique.

---

## 17. Producto implementado hasta ahora

A este nivel del proyecto:

```text
Contexto permanente de producto: preparado
Handoff técnico específico: preparado
README específico del producto: preparado
Dependencias instaladas: sí
Vulnerabilidad nanoid inicial: corregida
Motor de entrenamiento: no implementado
Tablas de entrenamiento: no creadas
Datos de mercado: no integrados
Supabase específico nuevo: no creado
Stripe específico nuevo: no creado
Vercel específico nuevo: no creado
Marca definitiva: no decidida
```

Para conocer los hashes, remoto y working tree exactos, revisar Git y el snapshot más reciente.

---

## 18. Próximos bloques recomendados

### Bloque inmediato

Cerrar la fundación del nuevo repositorio:

- Guardar `PRODUCT_CONTEXT.md`.
- Guardar este `PROJECT_HANDOFF.md`.
- Guardar el `README.md` específico.
- Guardar la actualización transitiva de `nanoid`.
- Crear repositorio GitHub privado propio.
- Conectar `origin`.
- Commit y push tras validación.

### Primer bloque visible

Después:

- Identidad técnica provisional.
- Eliminar lenguaje visible de “Base SaaS”.
- Diseñar navegación real del producto.
- Añadir entrada clara a `Entrenar`.
- Crear una primera ruta/pantalla de entrenamiento cuidada visualmente.
- Mantener intacta la infraestructura de autenticación, facturación y cuenta.

### Bloque posterior

- Definir formalmente `Exercise`.
- Definir formato de velas.
- Crear dataset interno.
- Integrar gráfico.
- Implementar primera decisión `long | short | no_trade`.

---

## 19. Cambio de chat

Cuando el usuario pida migrar a otro chat:

1. Actualizar este handoff si el estado funcional cambió de forma importante.
2. Generar snapshot del commit actual.
3. Entregar un prompt corto que ordene revisar:
   - instrucciones;
   - `PRODUCT_CONTEXT.md`;
   - `PROJECT_HANDOFF.md`;
   - snapshot más reciente;
   - `README.md`.
4. Indicar:
   - commit actual;
   - último bloque terminado;
   - pruebas superadas;
   - próximo bloque.

No es necesario preparar un prompt de migración en cada iteración.

---

**Fin de `PROJECT_HANDOFF.md`.**

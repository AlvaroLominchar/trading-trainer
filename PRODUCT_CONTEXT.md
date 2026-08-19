
# PRODUCT_CONTEXT — trading-trainer

> Contexto estable de producto para continuar el desarrollo en chats nuevos.
>
> **Propósito:** explicar qué negocio estamos construyendo, qué principios no deben romperse y cuál es la visión del producto.  
> **No es fuente de verdad del código:** para el estado técnico prevalecen Git, `PROJECT_HANDOFF.md` y el `PROJECT_SNAPSHOT_<commit>.txt` más reciente.  
> **Nombre actual:** `trading-trainer` es un nombre técnico provisional, no la marca definitiva.  
> **Estado:** definición inicial de producto previa al primer desarrollo funcional.

---

## 1. Visión

Construir una plataforma de entrenamiento de toma de decisiones para traders.

La experiencia no debe parecer un curso tradicional, un diario de trading ni un simulador abierto. El concepto central es un **gimnasio de decisiones**: sesiones cortas, interactivas y medibles en las que el usuario analiza escenarios de mercado y debe decidir qué haría.

La referencia conceptual es más cercana a un sistema de ejercicios como los puzzles de ajedrez o una aplicación de entrenamiento adaptativo que a una plataforma de gráficos convencional.

La visión a largo plazo puede incluir:

- Entrenamiento adaptativo.
- Perfil de habilidades.
- Retos diarios.
- Rachas y progresión.
- Ligas y competición.
- Modos de presión.
- Simulación de cuentas con reglas.
- Packs de entrenamiento.
- Contenido creado por terceros.
- Marketplace con comisión para la plataforma.

Estas posibilidades forman parte de la visión, no del alcance inicial.

---

## 2. Problema que queremos resolver

Una gran cantidad de contenido de trading se consume de forma pasiva:

- Vídeos.
- Cursos.
- Directos.
- Hilos.
- Capturas de gráficos.
- Explicaciones retrospectivas.

Consumir información no obliga al usuario a tomar decisiones ni permite comprobar de forma estructurada en qué se equivoca.

El producto pretende convertir parte de ese aprendizaje pasivo en práctica:

> Analizar → decidir → gestionar → revelar → aprender → repetir.

La aplicación debe entrenar procesos de decisión, no prometer rentabilidad.

---

## 3. Usuario inicial

El usuario inicial es una persona interesada en trading que:

- Ya entiende conceptos básicos de gráficos y operaciones.
- Consume contenido de trading en redes o plataformas educativas.
- Quiere practicar sin arriesgar dinero real.
- Valora sesiones cortas y visuales.
- Tiene interés por medir su rendimiento y compararlo consigo misma a lo largo del tiempo.
- Puede sentirse atraída por retos, progresión, estadísticas y competición.

No se presupone que el usuario sea rentable ni profesional.

---

## 4. Propuesta de valor

Propuesta conceptual:

> Entrena decisiones de trading mediante escenarios históricos o controlados, recibe feedback sobre tu proceso y descubre qué habilidades necesitas mejorar.

El producto no debe venderse como:

- Sistema de señales.
- Predictor de mercado.
- Método para ganar dinero.
- Garantía de superar evaluaciones.
- Servicio de asesoramiento financiero.
- Sustituto de una formación regulada o profesional cuando esta sea necesaria.

---

## 5. Principios del producto

### 5.1 Decisiones antes que consumo

El usuario debe actuar. La aplicación no debe convertirse en una biblioteca de vídeos con una capa de gamificación.

### 5.2 Proceso antes que resultado

Una operación ganadora puede ser una mala decisión y una operación perdedora puede estar bien ejecutada.

La puntuación no puede depender únicamente de si el precio terminó subiendo o bajando.

### 5.3 No operar y esperar no son lo mismo

La aplicación debe poder recompensar correctamente la abstención cuando el escenario no justifique una operación según la rúbrica definida.

`No operar` es una decisión terminal sobre la oportunidad que se está evaluando. `Esperar` es una acción temporal distinta: el usuario decide que todavía falta confirmación, revela una cantidad limitada de información adicional y vuelve a decidir después. Esta diferencia debe entrenar especialmente Timing y Disciplina sin convertir el futuro en una justificación retroactiva.

### 5.4 Feedback explicable

Las puntuaciones importantes deben poder justificarse mediante reglas, datos y rúbricas comprensibles.

La IA podrá ayudar a explicar o resumir, pero no debe inventar la verdad del ejercicio.

### 5.5 Entrenamiento medible

El usuario debe poder observar evolución por habilidades y no únicamente una puntuación global.

### 5.6 Sesiones cortas y repetibles

El producto debe funcionar bien en sesiones breves y resultar agradable tanto en móvil como en escritorio.

### 5.7 Producto visual desde el principio

Cada bloque funcional debe quedar suficientemente pulido antes de acumular nuevas funcionalidades.

Se priorizan:

- Interfaces limpias.
- Movimiento suave y útil.
- Feedback inmediato.
- Buen aspecto en capturas y grabaciones.
- Componentes que puedan utilizarse en vídeos promocionales.
- Jerarquía visual clara.
- Responsive real.

No se acumularán grandes cantidades de funcionalidad provisional para “diseñarlas al final”.

---

## 6. Bucle principal de entrenamiento

El bucle objetivo, que se implementará progresivamente, es:

1. Presentar un escenario.
2. Mostrar únicamente la información disponible hasta un punto temporal.
3. Pedir al usuario que analice el contexto.
4. Permitir decidir:
   - Largo.
   - Corto.
   - No operar.
   - O, cuando el escenario lo permita, Esperar una cantidad limitada de velas y volver a decidir con la nueva información visible.
5. En fases posteriores, permitir definir:
   - Entrada.
   - Invalidación.
   - Stop.
   - Objetivo.
   - Riesgo.
6. Pedir un nivel de confianza.
7. Revelar progresivamente lo ocurrido después.
8. Evaluar la decisión mediante una rúbrica.
9. Explicar puntos fuertes y errores.
10. Actualizar el perfil de habilidades.
11. Elegir ejercicios posteriores en función de las áreas a mejorar.

La primera versión no necesita implementar todos los pasos.

---

## 7. Habilidades candidatas

La taxonomía exacta se definirá antes de crear la base de datos definitiva.

Dimensiones candidatas:

- Lectura de tendencia.
- Lectura de rango.
- Contexto.
- Timing de entrada.
- Calidad de invalidación.
- Gestión del riesgo.
- Relación riesgo/beneficio.
- Disciplina.
- Capacidad de no operar.
- Gestión durante la operación.
- Control de drawdown.
- Consistencia.
- Calibración de confianza.
- Identificación de rupturas.
- Identificación de falsas rupturas.
- Gestión bajo presión.

No todas deben existir en V1.

---

## 8. Sistema conceptual de puntuación

La aplicación no tendrá inicialmente una única regla “acierto = puntos”.

La puntuación podrá componerse de dimensiones independientes, por ejemplo:

- Lectura del contexto.
- Calidad de la decisión.
- Gestión del riesgo.
- Disciplina.
- Coherencia entre entrada, stop y objetivo.
- Gestión durante la operación.
- Calibración de confianza.
- Resultado económico simulado.

Principios:

- El resultado económico no debe dominar toda la puntuación.
- Una decisión afortunada pero mal construida debe poder obtener una nota baja.
- Una decisión razonable que termine perdiendo debe poder obtener una nota aceptable.
- Las rúbricas deben estar versionadas.
- Los cambios de puntuación deberán cubrirse con pruebas automatizadas.
- Los ejercicios ambiguos no deben fingir que existe una única respuesta objetiva si no la hay.

---

## 9. Mercado y datos iniciales

### Mercado inicial previsto

Para simplificar la primera versión:

- BTC spot.
- ETH spot.
- Escenarios históricos o sintéticos.
- Sin datos en tiempo real.
- Sin derivados en la primera fase.
- Activo y fecha podrán permanecer ocultos durante el ejercicio.

Esta elección puede cambiar si la investigación de licencias de datos recomienda otra alternativa.

### Estrategia de datos

Fases:

1. **Desarrollo interno:** escenarios sintéticos o datos de prueba controlados.
2. **Alpha:** conjunto pequeño de escenarios con derechos de uso correctamente resueltos.
3. **Beta pública:** proveedor o licencia que permita expresamente el uso comercial y la visualización externa necesaria.
4. **Expansión:** añadir mercados únicamente cuando el uso y los ingresos justifiquen el coste.

No asumir que un dato visible gratuitamente en Internet puede redistribuirse comercialmente.

Google Finance no se considera actualmente una fuente adecuada para alimentar el producto.

---

## 10. Límites regulatorios del producto

Estos límites son decisiones internas de diseño y deberán revisarse jurídicamente antes de un lanzamiento comercial. No constituyen asesoramiento legal.

### Diseño inicial permitido por el producto

Priorizar:

- Escenarios históricos o sintéticos.
- Evaluación retrospectiva.
- Entrenamiento de lectura, proceso y riesgo.
- Activos y fechas ocultos cuando ayude a evitar interpretación como señal.
- Ausencia de ejecución real.
- Ausencia de conexión con brokers en V1.
- Ausencia de recomendaciones sobre el mercado actual.
- Ausencia de promesas de rentabilidad.
- Ausencia de personalización basada en patrimonio, ingresos o situación financiera.

### Funcionalidades que requieren revisión antes de incorporarse

- Señales actuales.
- Recomendaciones de compra o venta.
- Alertas sobre activos reales en tiempo real.
- Predicciones personalizadas.
- Copy trading.
- Ejecución de operaciones.
- Gestión de carteras.
- Asesoramiento individual.
- Patrocinios o afiliación con brokers o productos financieros.
- Packs de terceros que puedan contener recomendaciones.
- Promesas de superar cuentas de fondeo.
- Publicidad que sugiera resultados económicos garantizados.

Antes de abrir una versión pública de pago debe realizarse una revisión específica del producto y su comunicación comercial respecto del marco aplicable en España, incluyendo CNMV cuando corresponda.

---

## 11. IA

La IA es una herramienta secundaria, no el producto.

Usos potenciales:

- Explicar una puntuación en lenguaje natural.
- Resumir sesiones.
- Detectar patrones en errores históricos.
- Adaptar el tono o nivel de detalle de una explicación.
- Ayudar internamente a etiquetar escenarios.

No debe utilizarse inicialmente para:

- Inventar la respuesta correcta.
- Generar señales.
- Predecir el siguiente movimiento del mercado.
- Sustituir las rúbricas deterministas.
- Fabricar resultados o datos.

---

## 12. Experiencia visual y distribución

La propia aplicación debe producir material atractivo para promoción sin que el fundador tenga que aparecer.

El diseño debe facilitar formatos como:

- “¿Largo, corto o no operar?”
- “Tienes 10 segundos.”
- “¿Dónde pondrías el stop?”
- “Esta operación ganó, pero fue una mala decisión.”
- “El X % eligió una opción distinta.”
- “Encuentra el error.”
- Revelado progresivo del gráfico.
- Tarjetas de resultado compartibles.

La landing deberá reservar espacio para:

- Demostración interactiva.
- Vídeos cortos.
- Explicación visual del flujo.
- Capturas del dashboard.
- Ejemplos de resultados.
- Prueba social cuando exista de forma real.

No inventar cifras de usuarios, rentabilidad, resultados ni testimonios.

---

## 13. Modelo de negocio

La monetización exacta no está definida.

La infraestructura actual mantiene planes:

- Free.
- Plus.
- Premium.

No se asignarán capacidades definitivas hasta comprobar qué funciones producen valor.

Hipótesis futuras:

- Reto diario gratuito.
- Biblioteca ampliada.
- Entrenamiento adaptativo.
- Perfil avanzado de habilidades.
- Modos de presión.
- Simulaciones más complejas.
- Ligas y grupos privados.
- Packs temáticos.
- Herramientas para creadores.
- Marketplace con comisión.

Los precios existentes en la plantilla son técnicos y provisionales; no representan todavía la estrategia comercial de este producto.

---

## 14. Retención y gamificación

La aplicación puede utilizar:

- Rachas.
- Niveles.
- Experiencia.
- Ligas.
- Retos diarios.
- Temporadas.
- Comparación agregada.
- Logros.
- Historial.
- Baraja personal de errores.

La gamificación debe premiar comportamientos compatibles con el objetivo educativo:

- Disciplina.
- Gestión de riesgo.
- Consistencia.
- Reflexión.
- Mejora.
- Capacidad de no operar.

No debe premiar simplemente:

- Operar más.
- Arriesgar más.
- Mantenerse conectado más tiempo.
- Realizar compras impulsivas.

---

## 15. MVP interno

Antes de depender de usuarios externos o proveedores de datos, se priorizará integrar todo lo que pueda construirse y validarse internamente.

Primera meta jugable:

1. Pantalla de entrenamiento cuidada visualmente.
2. Gráfico de velas con dataset controlado.
3. Escenario con futuro oculto.
4. Decisión:
   - Largo.
   - Corto.
   - No operar.
   - Esperar una vela y volver a decidir cuando el escenario lo admita.
5. Nivel de confianza.
6. Revelado del desarrollo posterior.
7. Puntuación básica.
8. Explicación.
9. Resultado visual compartible.
10. Persistencia cuando el modelo esté suficientemente definido.

No se necesita todavía:

- Usuarios beta.
- Datos comerciales.
- Tiempo real.
- Marketplace.
- Premios.
- Integraciones con brokers.
- Stripe Live.

---

## 16. Roadmap conceptual

### Fase A — Fundamentos del producto

- Contexto estable.
- Identidad provisional.
- Modelo de ejercicio.
- Taxonomía de habilidades.
- Reglas de puntuación.
- Dataset interno.

### Fase B — Primer entrenamiento jugable

- Gráfico.
- Decisión.
- Confianza.
- Revelado.
- Resultado.
- Diseño responsive y pulido.

### Fase C — Persistencia y progreso

- Intentos.
- Historial.
- Perfil de habilidades.
- Dashboard real.
- Reto diario.

### Fase D — Entrenamiento adaptativo

- Baraja de errores.
- Selección de escenarios.
- Repetición.
- Resumen de progreso.

### Fase E — Producto comercial

- Landing definitiva.
- Onboarding específico.
- Analítica.
- Límites por plan.
- Revisión legal.
- Licencia de datos.
- Stripe Live cuando proceda.

### Fase F — Competición

- Ligas.
- Temporadas.
- Retos entre usuarios.
- Modos de presión.
- Equipos.

### Fase G — Plataforma

- Editor para terceros.
- Packs.
- Academias o creadores.
- Marketplace.
- Comisión de plataforma.

Las fases posteriores no deben condicionar innecesariamente el MVP.

---

## 17. Arquitectura heredada que debe conservarse

El producto parte de `plantilla-saas` en el commit:

```text
ba997e2
```

Se conserva salvo razón técnica explícita:

- Next.js App Router.
- TypeScript.
- Tailwind CSS 4.
- Supabase Auth.
- PostgreSQL.
- Row Level Security.
- Perfiles.
- Google OAuth.
- Stripe Checkout.
- Customer Portal.
- Webhooks.
- Planes Free, Plus y Premium.
- Protección por plan.
- Onboarding.
- Eliminación segura de cuenta.
- Temas semánticos.
- Cabeceras de seguridad.
- Páginas legales provisionales.
- Vitest.
- Vercel como despliegue previsto.

No reconstruir estas piezas por rutina.

---

## 18. Forma de trabajo

- Desarrollar en bloques pequeños y verificables.
- Priorizar funcionalidades que puedan integrarse sin depender de pruebas externas.
- Evitar introducir servicios externos antes de necesitarlos.
- Mantener calidad visual durante todo el desarrollo.
- No solicitar ni exponer secretos.
- No modificar migraciones ya aplicadas; crear migraciones nuevas.
- Mantener RLS y permisos mínimos.
- Ejecutar pruebas, lint, build y `git diff --check` tras cada bloque importante.
- Hacer commit y push únicamente después de validar el bloque.
- Mantener el repositorio de la plantilla separado del repositorio del producto.

---

## 19. Contexto para migrar a otro chat

Cuando se continúe el proyecto en otro chat, el nuevo chat debe revisar, en este orden:

1. Instrucciones del proyecto.
2. `PRODUCT_CONTEXT.md`.
3. `PROJECT_HANDOFF.md`.
4. El `PROJECT_SNAPSHOT_<commit>.txt` más reciente.
5. `README.md`.
6. Los archivos concretos afectados por el siguiente bloque.

Regla de autoridad:

```text
Git / snapshot más reciente
        ↓
PROJECT_HANDOFF.md
        ↓
PRODUCT_CONTEXT.md
        ↓
README.md
        ↓
recuerdos de conversaciones
```

`PRODUCT_CONTEXT.md` gobierna la intención del negocio.  
Git y el snapshot gobiernan lo que realmente existe en el código.

Cuando el usuario pida cambiar de chat, se preparará un prompt corto de traspaso indicando:

- Qué fuentes debe leer.
- Commit actual.
- Último bloque terminado.
- Validaciones superadas.
- Próximo bloque recomendado.
- Cualquier decisión todavía abierta.

No es necesario generar un nuevo prompt de traspaso tras cada iteración.

---

## 20. Decisiones abiertas

Todavía no están cerrados:

- Marca.
- Dominio.
- Idioma principal del producto.
- Precios.
- Capacidades definitivas de Free, Plus y Premium.
- Proveedor de datos.
- Universo final de mercados.
- Taxonomía definitiva de habilidades.
- Fórmula exacta de puntuación.
- Uso exacto de IA.
- Mecánicas de competición.
- Premios promocionales.
- Marketplace.
- Afiliación.
- Estrategia de adquisición de pago.

Estas decisiones se tomarán cuando exista suficiente información para justificarlas.

---

**Fin de `PRODUCT_CONTEXT.md`.**

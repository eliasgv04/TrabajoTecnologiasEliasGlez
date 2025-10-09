# Gramola Virtual (Jukebox) con Spotify

Proyecto para desarrollar una gramola virtual para bares y locales, usando la API de Spotify para ofrecer catálogo y reproducir en el dispositivo del establecimiento.

Estado: Backend y Frontend en marcha (MVP auth+UI) y documentación actualizada (ver `docs/`).

## Objetivo (MVP)

- Clientes del local pueden buscar canciones (Spotify), pagar (simulado) y encolarlas.
- El dispositivo del bar (con Spotify Premium del propietario) reproduce la cola.
- El bar puede moderar la cola y aplicar reglas anti-spam.

## Alcance actual y decisiones recientes

- Autenticación simplificada (MVP):
  - Registro, login, logout y borrado de cuenta con sesiones (HttpSession).
  - Sin verificación por email ni tokens; reset de contraseña por email directo.
  - Respuestas JSON homogéneas `{ "message": "..." }` para Postman y UI.
- UI/UX:
  - Navbar con lógica de visibilidad (oculta Inicio en la cola si estás logueado).
  - Botones y enlaces auditados (Registro/Login/Reset) y estilos unificados.
  - Vista de “Restablecer contraseña” modernizada y funcional.
- Limpieza:
  - Eliminadas entidades/repos de tokens (verificación y reset) en backend.
  - Eliminado componente `Forgot` en frontend; `/forgot` redirige a `/reset`.
  - Silenciado el SQL de Hibernate y añadido logs informativos breves.

- Pagos 100% simulados: no habrá cobros reales ni integración con pasarelas en el MVP de la práctica. Se registrarán "pagos" en base de datos a modo de simulación y los precios se gestionarán desde la base de datos (no hardcodeados).
- Gestión de cuentas del bar: registro, verificación por email (token), login, recuperación de contraseña y suscripción mensual/anual almacenada en base de datos. En desarrollo se usará un servicio de correo de pruebas (p. ej., Mailtrap) para no enviar emails reales.
- Gramola para clientes: búsqueda vía backend (Spotify API), inserción en cola tras "pago" simulado, cola prioritaria por delante de la playlist base, moderación por el bar y reglas anti-spam (límites y cooldown).
- Continuidad: cuando la cola de la gramola queda vacía, continúa la playlist base del bar.
- Privacidad y seguridad: no se manejan datos de tarjeta ni dinero real; no se guardan datos personales innecesarios. Los tokens de Spotify del bar se gestionan sólo en el backend.

## Estructura

- `docs/`
  - `01_requisitos_mvp.md`: Requisitos y alcance del MVP
  - `02_roles_flujos.md`: Actores, casos de uso y flujos
- `practica.docx` y `practica.pdf`: Documentos de la asignatura

## Tecnologías

- Frontend: Angular (v17+), arquitectura de vistas, modelos y servicios.
- Backend: Java con Spring Boot, capas de controladores, servicios y repositorios (Spring Data JPA).
- Base de datos: MySQL.

## Funcionalidades del MVP actual (resumen)

- Cuentas (propietario):
  - Registro con auto-login, login/logout, borrado de cuenta.
  - Restablecimiento de contraseña por email (sin tokens).
- UI:
  - Home, Login, Registro, Reset y Cola con navegación coherente.
  - Estilo moderno unificado y botones funcionales.
- Backend:
  - Endpoints con respuestas `{message}` y logs claros en consola.
  - Mapeo de timestamps en `users` y compatibilidad con MySQL.

En preparación (Spotify): búsqueda de canciones mediante Client Credentials y API de cola.

- Front (Propietario del bar):
  - Crear cuenta (nombre del bar, email, contraseña/confirmación) con verificación por email.
  - Loguearse y cerrar sesión.
  - Recuperar contraseña (solicitud y cambio mediante token enviado por email).
  - Suscripción mensual/anual (planes y precios en base de datos; registro de alta en DB, sin cobro real).
- Front (Cliente del bar):
  - Buscar canciones.
  - Insertar canción en la cola tras confirmar el importe (simulado) definido en la base de datos.
  - Al insertar, la canción se "cuela" y sonará a continuación de la actual.
- Back (Spring Boot):
  - Contrapartes de todas las funcionalidades anteriores.
  - Guardar en MySQL las canciones que se solicitan y los pagos simulados.
  - Integración con proveedor de correo para verificación y recuperación.
  - Integración con Spotify para búsqueda y control del dispositivo del bar (Add to Queue / control de reproducción).

## Criterios de valoración (resumen)

- Gestión de cuentas (front y back) — 2 puntos. Si falla, suspenso.
- Buscar e insertar en cola — 2 puntos. Si falla, suspenso.
- Reproducir canción — 2 puntos. Si no hay Premium, se admite simulación de reproducción.
- Casos de prueba funcionales — 2 puntos.
- Interfaz responsive — 1 punto.
- Buen diseño arquitectónico — 1 punto.

Detalles en `docs/08_criterios_valoracion.md` y plan de pruebas en `docs/09_plan_pruebas_funcionales.md`.

## Próximos pasos

1. Definir DTO de Track y contratos de `/music/search` y `/queue` (MVP con Spotify Client Credentials).
2. Implementar backend de búsqueda (proxy a Spotify) con cache corta y manejo de rate limit.
3. Implementar API de cola (POST/GET) y UI de búsqueda + añadir a cola en la vista de Cola.
4. Sprint 2: eliminar de cola, y posterior OAuth para reproducción Premium (si procede).

---
Nota legal/técnica: Controlar reproducción requiere Spotify Premium y cumplir términos de Spotify. Para fines académicos se pueden usar previews de 30s cuando no haya dispositivo controlable.
# Changelog

## 2025-10-09

Backend
- Simplificada autenticación: sin verificación por email ni tokens; reset por email directo.
- Endpoints devuelven `{ "message": "..." }` para respuestas consistentes (Postman/Frontend).
- Logs INFO breves para acciones (Registro/Login/Logout/Reset); SQL de Hibernate silenciado.
- Eliminadas entidades/repositorios de Tokens (VerificationToken, PasswordResetToken).

Frontend (Angular)
- Navbar: oculta “Inicio” en la cola para usuarios logueados; botón “Entrar” retirado; “Salir” activo.
- Botones de navegación auditados y corregidos (Registro/Login/Reset). Enlace de login va a `/reset`.
- Página de Reset: UI/UX mejorados, estados de carga y mensajes.
- Eliminado componente `Forgot` y redirección `/forgot` → `/reset`.

Documentación
- README y arquitectura actualizados para reflejar la simplificación de auth y plan Spotify por fases.
- Plan de integración con Spotify detallado (Fase 1 Client Credentials, Fase 2 OAuth Premium).

Próximos pasos
- Definir DTO de Track y contratos `/music/search` y `/queue` (Sprint 1).
- Implementar búsqueda y cola (add/list); Sprint 2: remove + pulidos.
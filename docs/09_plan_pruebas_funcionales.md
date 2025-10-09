# Plan de pruebas funcionales (MVP)

## Objetivo
Asegurar que las funcionalidades críticas de la rúbrica funcionan perfectamente.

## Escenarios mínimos

1. Gestión de cuentas (bar)
   - Registro: completar formulario (bar, email, password), recibir email de verificación (Mailtrap), activar cuenta con token.
   - Login: acceder con credenciales correctas, rechazar credenciales erróneas.
   - Recuperación: solicitar reset, recibir email con token, cambiar contraseña.
   - Suscripción: seleccionar plan mensual/anual y registrar en DB (simulado, sin cobro real).
   - Logout.

2. Búsqueda y encolado
   - Cliente se une a sala; busca por canción/artista.
   - Selecciona tema, confirma importe (desde DB), se crea `queue_item` con estado `pending`.
   - Ver cola actualizada en tiempo real (SSE); límites y cooldown aplican.

3. Reproducción
   - Con dispositivo Spotify activo: al terminar la pista actual, se reproduce la primera de la cola (Add to Queue) en orden correcto.
   - Sin dispositivo Premium: activar modo simulación (contador/visualización) o previews.

4. Moderación (bar)
   - Reordenar/eliminar entradas; bloquear usuario abusivo; reglas aplicadas.

5. Responsive
   - Verificar diseño en móvil (360x640), tablet (768x1024) y desktop (1440x900).

## Evidencias
- Capturas de pantalla, logs del backend, y exportación de base de datos con registros clave.

## Métricas de prueba
- Tasa de éxito por escenario (>95% en pruebas repetidas).
- Latencia promedio de búsqueda (<1.5s p95 con cache).

## Preparación
- Entornos: Mailtrap configurado; variables de entorno para Spotify; MySQL con esquema creado.
- Datos semilla: planes de suscripción, precio por canción, sala de ejemplo.

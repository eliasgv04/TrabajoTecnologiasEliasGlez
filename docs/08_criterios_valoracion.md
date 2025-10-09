# Criterios de valoración (rúbrica)

La práctica se puntúa sobre 10 puntos:

1) Gestión de cuentas de usuario (front y back) — 2 puntos
   - Registro con verificación por email; login; recuperación de contraseña; logout; suscripción mensual/anual en DB.
   - Nota: si esto no funciona perfectamente, la práctica está suspensa.

2) Buscar una canción e insertarla en la cola — 2 puntos
   - Búsqueda vía Spotify API (proxy backend) y encolado tras pago simulado (precio desde DB).
   - Nota: si esto no funciona perfectamente, la práctica está suspensa.

3) Reproducir canción — 2 puntos
   - Control de reproducción con Spotify Connect en dispositivo del bar (Premium). Alternativa si no hay Premium: simulación de reproducción o otro proveedor.

4) Casos de prueba funcionales — 2 puntos
   - Se prepararán escenarios de prueba y evidencia (capturas/logs). Ver `docs/09_plan_pruebas_funcionales.md`.

5) Interfaz responsive — 1 punto
   - UI adaptable a móvil/tablet/PC.

6) Buen diseño arquitectónico — 1 punto
   - Capas claras (front vistas/modelos/servicios; back controllers/services/repos) y separación de responsabilidades.

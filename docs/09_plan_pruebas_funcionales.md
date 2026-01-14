# Plan de pruebas funcionales (estado actual)

## Objetivo
Validar que las funcionalidades críticas de la práctica funcionan de extremo a extremo: cuentas, búsqueda/cola, pagos (monedas/suscripción) y reproducción real con Spotify.

## Preparación

- Backend en `https://localhost:8000`
- Frontend en `https://localhost:4200` (recomendado)
- MySQL con BD `gramola`
- Mailtrap configurado en `application.properties`
- Spotify app configurada con Redirect URI `https://127.0.0.1:8000/spotify/callback`

## Escenarios mínimos

1) Gestión de cuentas

- Registro (con verificación):
   - Registrar usuario (`/register`).
   - Recibir email (Mailtrap) y verificar con el enlace.
- Login:
   - Login con correo.
   - Login con “nombre del bar” (si se guardó en ajustes/registro).
   - Intento de login sin verificar -> debe fallar con mensaje claro.
- Reset por token:
   - Solicitar reset.
   - Recibir email con token/enlace.
   - Cambiar contraseña y volver a iniciar sesión.

2) Pagos y saldo

- Comprar pack de monedas:
   - Iniciar pago pack (`/payments/prepay?matches=10`).
   - Confirmar (`/payments/confirm`) y verificar aumento de monedas.

3) Búsqueda y encolado

- Buscar un tema (`/music/search?q=...`) y validar que aparecen resultados.
- Encolar un tema (`POST /queue`) y validar:
   - La cola se actualiza (`GET /queue`).
   - El saldo baja (si no hay saldo, debe devolver 402 “Saldo insuficiente”).

4) Suscripción

- Listar planes (`/subscriptions/plans`).
- Activar suscripción (`/subscriptions/prepay` + `/subscriptions/confirm`).
- Validar estado (`/subscriptions/status`) y monedas acreditadas.

5) Spotify OAuth y reproducción real

- Conectar Spotify:
   - Iniciar OAuth desde la app.
   - Volver a la cola tras autorizar.
- Reproducción:
   - Comprobar que existe dispositivo “Gramola Player” (Web Playback SDK).
   - Transferir reproducción y reproducir una canción de la cola.
   - Probar pausa y reanudar.
   - Probar seek (mover barra y validar que continúa desde el punto).

6) Continuidad / playlist base

- Configurar `spotifyPlaylistUri` en ajustes.
- Vaciar cola y verificar que suena la playlist base o se mantiene la música base.

7) Navegación

- Con una canción sonando, ir a “Cuenta” y volver a “Cola”: la reproducción no debe reiniciarse desde 0.

## Pruebas con Selenium (obligatorias)

Los escenarios que deben probarse con Selenium son:

1) Un cliente del bar busca una canción. Paga y la pone.
    - Se comprobará que el pago se ha confirmado en la base de datos.
    - Se comprobará que la canción se ha añadido a la lista de canciones que el bar mantiene en el backend.

2) Un cliente del bar busca una canción. Pone mal los datos de pago y se produce un error.

### Enfoque recomendado

- Selenium automatiza el navegador (UI real) para simular al “cliente”.
- La comprobación de BD se hace desde el propio test (repositorios JPA) contra la misma BD MySQL.
- Stripe se prueba en modo test con tarjetas de prueba:
   - Éxito: 4242 4242 4242 4242
   - Rechazo: 4000 0000 0000 0002

### Prerrequisitos para que funcione

- Backend levantado en HTTPS: `https://localhost:8000`
- Frontend levantado en: `https://localhost:4200` (con `proxy.conf.json` y `secure:false`)
- BD MySQL accesible con los datos de `backend/src/main/resources/application.properties`
- Para que la ruta `/queue` no redirija a Spotify durante Selenium, el test activa “modo E2E”:
   - Antes del login ejecuta `localStorage.setItem('e2e:disableSpotify','1')`.
   - Esto evita depender de OAuth/Spotify en la ejecución automática.

### Implementación en el proyecto

- Se ha añadido un test de ejemplo en [backend/src/test/java/edu/uclm/esi/gramola/e2e/PruebasFuncionalesSeleniumIT.java](backend/src/test/java/edu/uclm/esi/gramola/e2e/PruebasFuncionalesSeleniumIT.java)
- Se ejecuta con Maven en el perfil `e2e` (Failsafe), para no mezclarlo con los unit tests.

### Cómo ejecutar

1) Arrancar backend y frontend.
2) Ejecutar:

`mvn -Pe2e -DskipTests=false verify`

Si tu frontend no está en `https://localhost:4200`, puedes pasar:

`mvn -Pe2e -DskipTests=false -De2e.frontend=https://localhost:4200 verify`

## Evidencias

- Capturas de pantalla del front (registro/verificación, cola, reproducción, ajustes).
- Logs del backend (INFO/WARN) mostrando login, OAuth y control de reproducción.
- Estado en BD (tablas `users`, `spotify_tokens`, `queue_items`, `bar_settings`, `user_subscriptions`).
- Informes de Failsafe: `backend/target/failsafe-reports/failsafe-summary.xml` y `TEST-*.xml`.

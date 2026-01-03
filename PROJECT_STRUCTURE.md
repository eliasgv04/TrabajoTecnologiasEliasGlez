# Estructura del Proyecto

Raíz del repo:

- `backend/` (Spring Boot, Java 17, Maven)
  - `src/main/java/edu/uclm/esi/gramola/`
    - `http/` controladores REST (`/users`, `/queue`, `/spotify`, `/music`, `/settings`, `/payments`, `/subscriptions`, ...)
    - `services/` servicios de dominio e integraciones (Spotify, settings, suscripciones, usuarios)
    - `dao/` repositorios JPA
    - `entities/` entidades JPA
    - `dto/` DTOs de entrada/salida (p.ej. `TrackDTO`)
  - `src/main/resources/application.properties` (MySQL, SSL/HTTPS, Spotify, Stripe, Mailtrap)
  - `src/main/resources/ssl/` (keystore de desarrollo)
  - `pom.xml`

- `gramolafe/` (Angular 19, standalone)
  - `src/app/` componentes y servicios
  - `src/app/app.routes.ts` rutas (home/login/register/reset/queue/account/plans)
  - `proxy.conf.json` proxy dev (`/api` -> `https://localhost:8000`)
  - `package.json` scripts (`start`, `start:https`)

- `docs/` documentación del proyecto (requisitos, arquitectura, Spotify, pagos, pruebas)
- `README.md` guía rápida

Notas

- En desarrollo se usa HTTPS local (backend y opcionalmente frontend) para compatibilidad con Spotify OAuth.

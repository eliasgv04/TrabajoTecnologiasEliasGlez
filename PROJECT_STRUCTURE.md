# Estructura del Proyecto

.
- backend/ (Spring Boot, Java 17, Maven)
  - src/main/java/com/gramola/backend/
    - config/ (CORS)
    - controller/ (Auth, Password, Gramola, Playback)
    - service/ (Auth, Email, Gramola)
    - repository/ (BarAccountRepository, QueueItemRepository, ...)
    - domain/ (BarAccount, QueueItem, ...)
    - dto/ (Auth y Gramola DTOs)
  - src/main/resources/application.yml (MySQL, Mailhog, Spotify vars)
  - pom.xml
- frontend/ (Angular por módulos)
  - STRUCTURE.md (guía)
  - src/app/
    - auth/
    - gramola/
    - admin/
    - shared/services/
    - shared/models/
- docs/ (requisitos, arquitectura, integración, pagos, pruebas, etc.)
- docker-compose.yml (MySQL + Mailhog)
- .env.example (variables backend)
- .gitignore
- README.md

Notas
- Puedes inicializar Angular con CLI y usar esta estructura como guía.
- El backend ya tiene esqueleto y configuración de desarrollo.

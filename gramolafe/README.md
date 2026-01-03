# Gramolafe (Frontend)

Frontend Angular (standalone) de la Gramola.

## Requisitos

- Node.js + npm
- Backend levantado en `https://localhost:8000`

## Desarrollo

Instalar dependencias:

- `npm install`

Arranque (HTTP):

- `npm run start`

Arranque recomendado (HTTPS):

- `npm run start:https`

El frontend usa el proxy de `proxy.conf.json` para llamar al backend a través de `/api`:

- Front: `https://localhost:4200`
- Backend (proxy): `/api/*` -> `https://localhost:8000/*`

### Certificados para `start:https`

El script espera estos ficheros en la raíz de `gramolafe/`:

- `localhost.pem`
- `localhost-key.pem`

Puedes generarlos con una herramienta tipo `mkcert` (recomendado en Windows) o con OpenSSL si lo tienes disponible.

## Build

- `npm run build`

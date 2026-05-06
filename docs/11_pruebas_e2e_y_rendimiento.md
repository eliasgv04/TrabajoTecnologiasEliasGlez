# Pruebas E2E y Rendimiento

## 1. Prueba Funcional (Selenium)

### Escenarios

#### Escenario 1: Cliente busca canción, paga y la pone
1. Login con credenciales correctas
2. Sistema compra automáticamente suscripción activa si no la tiene
3. Usuario busca una canción (ej: "Imagine")
4. Usuario paga la canción con tarjeta de prueba válida (4242 4242 4242 4242)
5. Canción se encola

**Validaciones en BD:**
- La tabla `song_payments` contiene un registro con estado `CONFIRMED` para el usuario y la canción
- La tabla `queue_items` contiene un nuevo registro con la canción encolada

#### Escenario 2: Cliente intenta pagar con tarjeta rechazada
1. Login
2. Sistema compra automáticamente suscripción si es necesario
3. Usuario busca una canción
4. Usuario intenta pagar con tarjeta rechazada (4000 0000 0000 0002)
5. Sistema muestra error

**Validaciones en BD:**
- La tabla `song_payments` NO contiene registros confirmados para este intento fallido
- La tabla `queue_items` NO contiene la canción

### Prerequisitos

1. **Backend levantado:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   - Debe estar en `https://localhost:8000`
   - Conectado a MySQL (`gramola`)
   - Stripe en modo test

2. **Frontend levantado:**
   ```bash
   cd gramolafe
   npm install
   ng serve
   ```
   - Debe estar en `https://localhost:4200`
   - Configurado con SSL (proxy.conf.json con `secure:false`)

3. **Usuarios de prueba preexistentes:**
   - Los usuarios se crean automáticamente en la BD durante el test (verificados y listos para login)

### Ejecución

#### Headless (recomendado para CI/CD):
```bash
cd backend
mvn -Pe2e -DskipTests=false verify
```

#### Con navegador visible (depuración):
```bash
cd backend
mvn -Pe2e -DskipTests=false -De2e.headless=false -De2e.showBanner=true verify
```

#### Parámetros de control:
- `-De2e.headless=false` → Muestra navegador Chrome en tiempo real
- `-De2e.stepDelayMs=250` → Pausa de 250ms entre pasos (para ver qué pasa)
- `-De2e.showBanner=true` → Muestra banner en la página indicando qué paso se ejecuta
- `-De2e.keepOpen=true` → NO cierra el navegador al finalizar (para inspeccionar estado final)
- `-De2e.frontend=https://otro:puerto` → Si el frontend está en otro servidor

### Reporte

Los resultados se generan en:
```
backend/target/failsafe-reports/failsafe-summary.xml
backend/target/failsafe-reports/TEST-edu.uclm.esi.gramola.e2e.PruebasFuncionalesSeleniumIT.xml
```

---

## 2. Prueba de Rendimiento (JMeter)

### Escenario

**1000 usuarios preexistentes se loguean con credenciales correctas**

- 100 threads (usuarios simultáneos)
- 10 iteraciones por thread (100 × 10 = 1000 logins totales)
- Ramp-up: 60 segundos (escalado gradual para no saturar el servidor de golpe)
- Timeout por request: 10 segundos
- Credenciales: `user_1@test.local` hasta `user_100@test.local` (por thread) / `Password123!`

### Prerequisitos

1. **Backend levantado y accesible:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **1000 usuarios de prueba en BD:**
   - Se debe ejecutar un script SQL para crear los usuarios (o crearlos durante el setup)
   - Email: `user_1@test.local` a `user_1000@test.local`
   - Password: `Password123!` (BCrypt hasheado)
   - Estado: verificados (`verified=true`)

3. **JMeter instalado:**
   - [Descargar JMeter](https://jmeter.apache.org/download_jmeter.html)
   - Añadir bin de JMeter al PATH

### Ejecución

#### GUI (para diseño y debugging):
```bash
jmeter -t backend/src/test/jmeter/prueba_rendimiento_login.jmx
```

#### CLI (para CI/CD):
```bash
jmeter -n -t backend/src/test/jmeter/prueba_rendimiento_login.jmx \
        -l backend/target/jmeter_results.csv \
        -j backend/target/jmeter.log
```

#### Parámetros personalizables:
```bash
jmeter -n -t backend/src/test/jmeter/prueba_rendimiento_login.jmx \
        -JBASE_URL=https://localhost:8000 \
        -JNUM_THREADS=100 \
        -JRAMP_TIME=60 \
        -JLOOP_COUNT=10 \
        -l backend/target/jmeter_results.csv \
        -j backend/target/jmeter.log
```

### Creación de usuarios de prueba (SQL)

Ejecutar en MySQL antes de la prueba JMeter:

```sql
-- Tabla de usuarios (si no existe)
-- CREATE TABLE users (...) -- ya debe existir

-- Insertar 1000 usuarios de prueba
INSERT INTO users (email, password, verified, created_at)
SELECT 
    CONCAT('user_', @rn := @rn + 1, '@test.local') as email,
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm' as password, -- Password123! hasheado con BCrypt
    true,
    NOW()
FROM (SELECT 1) as t1, (SELECT @rn := 0) as t2
LIMIT 1000;
```

**Nota:** El hash BCrypt anterior corresponde a `Password123!`. Si necesitas otro password, usa un generador BCrypt.

### Reporte

Los resultados CSV se pueden analizar con:

```bash
# Ver resumen rápido
tail -20 backend/target/jmeter_results.csv

# Importar en Excel/Calc para gráficos
```

#### Métricas principales:
- **Throughput:** logins/segundo
- **Response Time (avg/min/max):** ms
- **Error Rate:** % de fallos
- **95th Percentile:** tiempo máximo que espera el 95% de usuarios

---

## 3. Configuración de Stripe para pruebas

En `application.properties`:

```properties
stripe.publicKey=pk_test_xxx
stripe.secretKey=sk_test_xxx
```

**Tarjetas de prueba:**
- **Éxito:** 4242 4242 4242 4242
- **Rechazada:** 4000 0000 0000 0002
- Fecha: cualquiera futura (ej: 12/34)
- CVC: cualquiera (ej: 123)

---

## 4. Troubleshooting

### Selenium falla con "página redirecciona a Spotify OAuth"
- Verificar que localStorage `e2e:disableSpotify=1` se inyecta antes del login (línea ~190 del test)
- Esto evita que `/queue` redirija a Spotify

### JMeter obtiene 401 (Unauthorized)
- Verificar que los usuarios existen en BD y están verificados (`verified=true`)
- Verificar que el endpoint `/auth/login` acepta POST con parámetros `email` y `password`

### JMeter: "Connection refused"
- Verificar que backend está en `https://localhost:8000` y accesible
- Si es en otra máquina, cambiar `-JBASE_URL`

### Selenium: elemento no encontrado (TimeoutException)
- Ejecutar con `-De2e.headless=false -De2e.stepDelayMs=500` para ver en tiempo real qué falla
- Verificar selectores CSS en el HTML del frontend

---

## 5. Integración en pipeline CI/CD

### Ejecutar ambas pruebas secuencialmente:

```bash
#!/bin/bash
set -e

echo "=== Compilar backend ==="
cd backend
mvn clean install -DskipTests

echo "=== Pruebas E2E Selenium ==="
mvn -Pe2e -DskipTests=false verify

echo "=== Pruebas de Rendimiento JMeter ==="
jmeter -n -t src/test/jmeter/prueba_rendimiento_login.jmx \
        -JNUM_THREADS=100 \
        -JLOOP_COUNT=10 \
        -l target/jmeter_results.csv \
        -j target/jmeter.log

echo "=== Todos los tests completados ==="
```

-- Script para crear 1000 usuarios de prueba para la prueba de rendimiento con JMeter
-- Ejecución: mysql -u root -p gramola < backend/dev/sql/insert_test_users_jmeter.sql

-- Password: Password123! (BCrypt hash)
-- Hash generado con: new BCryptPasswordEncoder().encode("Password123!")
-- El hash es: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm

SET @password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm';

-- Generar 1000 usuarios
INSERT INTO users (email, password, verified, created_at)
SELECT 
    CONCAT('user_', num, '@test.local') AS email,
    @password_hash AS password,
    1 AS verified,
    NOW() AS created_at
FROM (
    SELECT (@row := @row + 1) AS num
    FROM (
        SELECT @row := 0
    ) t1,
    (
        -- Tabla con suficientes filas para generar 1000
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) t2,
    (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) t3,
    (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) t4,
    (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) t5
    LIMIT 1000
) numbers
ON DUPLICATE KEY UPDATE
    password = @password_hash,
    verified = 1;

-- Verificar
SELECT COUNT(*) AS total_usuarios_creados FROM users WHERE email LIKE 'user_%@test.local';

-- Mostrar algunos ejemplos
SELECT id, email, verified FROM users WHERE email LIKE 'user_%@test.local' LIMIT 10;

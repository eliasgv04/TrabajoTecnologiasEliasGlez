package edu.uclm.esi.gramola;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.Timestamp;
import java.time.Instant;

@SpringBootTest
public class SeedJmeterUsersWithEncodedPasswordTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void seed1000UsersWithValidPasswordHash() {
        String encoded = passwordEncoder.encode("Password123!");
        Timestamp now = Timestamp.from(Instant.now());

        String sql = """
                INSERT INTO users (email, password, verified, created_at, updated_at)
                VALUES (?, ?, 1, ?, ?)
                ON DUPLICATE KEY UPDATE
                    password = VALUES(password),
                    verified = 1,
                    updated_at = VALUES(updated_at)
                """;

        for (int i = 1; i <= 1000; i++) {
            String email = "user_" + i + "@test.local";
            jdbcTemplate.update(sql, email, encoded, now, now);
        }

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email LIKE 'user_%@test.local'", Integer.class);
        Assertions.assertNotNull(count);
        Assertions.assertTrue(count >= 1000, "Expected at least 1000 seeded users, got: " + count);
    }
}

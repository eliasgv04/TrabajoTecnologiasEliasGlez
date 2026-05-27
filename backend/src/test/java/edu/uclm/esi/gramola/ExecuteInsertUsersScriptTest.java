package edu.uclm.esi.gramola;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootTest
public class ExecuteInsertUsersScriptTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void executeInsertScript() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            FileSystemResource resource = new FileSystemResource("dev/sql/insert_test_users_jmeter.sql");
            ScriptUtils.executeSqlScript(conn, resource);
        }

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email LIKE 'user_%@test.local'", Integer.class);

        Assertions.assertNotNull(count);
        Assertions.assertTrue(count >= 1000, "Expected at least 1000 test users inserted, got: " + count);
    }
}

package edu.uclm.esi.gramola;

import jakarta.persistence.EntityManager;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DatabaseInitializer {

    private final EntityManager entityManager;

    public DatabaseInitializer(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeDatabase() {
        try {
            // Fix the coins column to have a default value
            entityManager.createNativeQuery(
                "ALTER TABLE users MODIFY COLUMN coins INT DEFAULT 0 NOT NULL"
            ).executeUpdate();
            System.out.println("✓ Database migration completed: coins column fixed");
        } catch (Exception e) {
            // Column might already have default or other variations
            System.out.println("Database initialization note: " + e.getMessage());
        }
    }
}

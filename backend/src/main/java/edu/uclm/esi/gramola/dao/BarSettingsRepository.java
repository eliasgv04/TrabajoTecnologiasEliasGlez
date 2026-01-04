package edu.uclm.esi.gramola.dao;

/**
 * Repositorio JPA para acceder a los ajustes del bar (BarSettings).
 */

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import edu.uclm.esi.gramola.entities.BarSettings;

public interface BarSettingsRepository extends JpaRepository<BarSettings, Long> {
    Optional<BarSettings> findByUserId(Long userId);

    Optional<BarSettings> findFirstByBarNameIgnoreCase(String barName);
}

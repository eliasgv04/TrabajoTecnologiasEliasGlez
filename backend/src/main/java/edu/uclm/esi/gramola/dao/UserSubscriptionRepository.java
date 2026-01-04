package edu.uclm.esi.gramola.dao;

/**
 * Repositorio JPA para suscripciones de usuarios.
 */

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import edu.uclm.esi.gramola.entities.UserSubscription;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByEndAtDesc(Long userId, UserSubscription.Status status);
    long countByUserIdAndEndAtAfter(Long userId, LocalDateTime moment);
}

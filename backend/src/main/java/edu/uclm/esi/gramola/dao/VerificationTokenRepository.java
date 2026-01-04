package edu.uclm.esi.gramola.dao;

/**
 * Repositorio JPA para tokens de verificación de email.
 */

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.uclm.esi.gramola.entities.VerificationToken;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
}

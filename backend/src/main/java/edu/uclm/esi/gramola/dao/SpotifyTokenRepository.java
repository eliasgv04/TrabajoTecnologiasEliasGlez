package edu.uclm.esi.gramola.dao;

/**
 * Repositorio JPA para tokens OAuth de Spotify asociados a usuarios.
 */

import edu.uclm.esi.gramola.entities.SpotifyToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpotifyTokenRepository extends JpaRepository<SpotifyToken, Long> {
}

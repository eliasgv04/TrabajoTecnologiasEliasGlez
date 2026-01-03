package edu.uclm.esi.gramola.dao;

import edu.uclm.esi.gramola.entities.SpotifyToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpotifyTokenRepository extends JpaRepository<SpotifyToken, Long> {
}

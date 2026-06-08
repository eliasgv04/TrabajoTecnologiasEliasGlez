package edu.uclm.esi.gramola.dao;

import edu.uclm.esi.gramola.entities.PriceTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PriceTierRepository extends JpaRepository<PriceTier, Long> {

    @Query("SELECT p FROM PriceTier p WHERE :popularity BETWEEN p.popularityMin AND p.popularityMax ORDER BY p.popularityMin ASC")
    Optional<PriceTier> findByPopularity(@Param("popularity") int popularity);
}

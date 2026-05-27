package edu.uclm.esi.gramola.dao;

import edu.uclm.esi.gramola.entities.SongPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SongPaymentRepository extends JpaRepository<SongPayment, Long> {
    Optional<SongPayment> findByClientSecret(String clientSecret);

    Optional<SongPayment> findFirstByUserIdAndTrackIdAndStatusAndConsumedAtIsNullOrderByConfirmedAtDesc(
            Long userId,
            String trackId,
            SongPayment.Status status
    );
}
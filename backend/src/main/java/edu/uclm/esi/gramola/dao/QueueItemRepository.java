package edu.uclm.esi.gramola.dao;

/**
 * Repositorio JPA para la cola de reproducción (QueueItem).
 */

import edu.uclm.esi.gramola.entities.QueueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueueItemRepository extends JpaRepository<QueueItem, Long> {
    List<QueueItem> findAllByOrderByCreatedAtAsc();

    List<QueueItem> findAllByUser_IdOrderByCreatedAtAsc(Long userId);

    void deleteAllByUser_Id(Long userId);

    boolean existsByIdAndUser_Id(Long id, Long userId);
}

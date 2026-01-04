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
}

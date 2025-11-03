package edu.uclm.esi.gramola.dao;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import edu.uclm.esi.gramola.entities.SubscriptionPlan;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByCode(String code);
}

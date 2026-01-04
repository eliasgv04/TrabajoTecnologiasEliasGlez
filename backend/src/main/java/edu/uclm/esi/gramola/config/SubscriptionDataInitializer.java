package edu.uclm.esi.gramola.config;

/**
 * Inicializador de datos: crea/carga planes de suscripción por defecto al arrancar.
 */

import edu.uclm.esi.gramola.dao.SubscriptionPlanRepository;
import edu.uclm.esi.gramola.entities.SubscriptionPlan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SubscriptionDataInitializer {
    private static final Logger log = LoggerFactory.getLogger(SubscriptionDataInitializer.class);

    @Bean
    CommandLineRunner seedPlans(SubscriptionPlanRepository repo) {
        return args -> {
            if (repo.findByCode("MONTHLY").isEmpty()) {
                SubscriptionPlan m = new SubscriptionPlan();
                m.setCode("MONTHLY");
                m.setName("Mensual");
                m.setPriceEur(9); // 9€
                m.setDurationMonths(1);
                repo.save(m);
            }
            if (repo.findByCode("ANNUAL").isEmpty()) {
                SubscriptionPlan a = new SubscriptionPlan();
                a.setCode("ANNUAL");
                a.setName("Anual");
                a.setPriceEur(90); // 90€
                a.setDurationMonths(12);
                repo.save(a);
            }
            log.info("Subscription plans seeded");
        };
    }
}

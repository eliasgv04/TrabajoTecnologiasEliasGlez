package edu.uclm.esi.gramola.config;

import edu.uclm.esi.gramola.dao.PriceTierRepository;
import edu.uclm.esi.gramola.entities.PriceTier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PriceTierDataLoader implements CommandLineRunner {

    private final PriceTierRepository repo;

    public PriceTierDataLoader(PriceTierRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() == 0) {
            repo.saveAll(List.of(
                tier(0,  40, 1),
                tier(41, 70, 2),
                tier(71, 100, 3)
            ));
        }
    }

    private PriceTier tier(int min, int max, int price) {
        PriceTier t = new PriceTier();
        t.setPopularityMin(min);
        t.setPopularityMax(max);
        t.setPriceEur(price);
        return t;
    }
}

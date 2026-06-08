package edu.uclm.esi.gramola.http;

/**
 * Controlador REST para precio por canción y estimaciones.
 */

import org.springframework.beans.factory.annotation.Value;
import edu.uclm.esi.gramola.dao.PriceTierRepository;
import edu.uclm.esi.gramola.services.SpotifyService;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/billing")
public class BillingController {
    private final SpotifyService spotifyService;
    private final PriceTierRepository priceTiers;

    @Value("${app.pricePerSong:1}")
    private int defaultPrice;

    public BillingController(SpotifyService spotifyService, PriceTierRepository priceTiers) {
        this.spotifyService = spotifyService;
        this.priceTiers = priceTiers;
    }

    @GetMapping("/price")
    public Map<String, Integer> price() {
        return Map.of("pricePerSong", defaultPrice);
    }

    @GetMapping("/estimate")
    public Map<String, Object> estimate(HttpSession session, @RequestParam("trackId") String trackId) {
        int popularity = 0;
        try {
            popularity = spotifyService.getTrackPopularity(session, trackId);
        } catch (Exception ignored) {}
        int price = priceForPopularity(popularity);
        return Map.of("trackId", trackId, "price", price, "popularity", popularity);
    }

    public int priceForPopularity(int popularity) {
        return priceTiers.findByPopularity(popularity)
                .map(t -> t.getPriceEur())
                .orElse(defaultPrice);
    }
}

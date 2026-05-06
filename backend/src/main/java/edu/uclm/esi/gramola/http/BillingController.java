package edu.uclm.esi.gramola.http;

/**
 * Controlador REST para precio por canción y estimaciones.
 */

import org.springframework.beans.factory.annotation.Value;
import edu.uclm.esi.gramola.services.SpotifyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/billing")
public class BillingController {
    private final SpotifyService spotifyService;

    @Value("${app.pricePerSong:1}")
    private int pricePerSong;

    public BillingController(SpotifyService spotifyService) {
        this.spotifyService = spotifyService;
    }

    @GetMapping("/price")
    public Map<String, Integer> price() {
        return Map.of("pricePerSong", pricePerSong);
    }

    @GetMapping("/estimate")
    public Map<String, Object> estimate(HttpSession session, @RequestParam("trackId") String trackId) {
        int popularity = 0;
        try {
            popularity = spotifyService.getTrackPopularity(session, trackId);
        } catch (Exception ignored) {}
        int price = (popularity <= 40) ? 1 : (popularity <= 70 ? 2 : 3);
        return Map.of("trackId", trackId, "price", price, "popularity", popularity);
    }
}

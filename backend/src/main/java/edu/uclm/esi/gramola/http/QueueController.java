package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dao.QueueItemRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dto.TrackDTO;
import edu.uclm.esi.gramola.entities.QueueItem;
import edu.uclm.esi.gramola.entities.User;
import org.springframework.beans.factory.annotation.Value;
import edu.uclm.esi.gramola.services.SubscriptionService;
import edu.uclm.esi.gramola.services.SettingsService;
import edu.uclm.esi.gramola.services.SpotifyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import jakarta.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/queue")
public class QueueController {
    private final QueueItemRepository repo;
    private final UserRepository users;
    private final SubscriptionService subscriptionService;
    private final SettingsService settingsService;
    private final SpotifyService spotifyService;

    @Value("${app.pricePerSong:1}")
    private int defaultPricePerSong;

    public QueueController(QueueItemRepository repo, UserRepository users, SubscriptionService subscriptionService, SettingsService settingsService, SpotifyService spotifyService) {
        this.repo = repo;
        this.users = users;
        this.subscriptionService = subscriptionService;
        this.settingsService = settingsService;
        this.spotifyService = spotifyService;
    }

    @GetMapping
    public ResponseEntity<?> list(HttpSession session) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        List<QueueItem> items = repo.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<?> add(HttpSession session, @RequestBody TrackDTO track) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        Long userId = (Long) session.getAttribute("userId");
        // Require an active subscription to add songs
        try {
            subscriptionService.requireActive(userId);
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
        }
        User u = users.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
        int pricePerSong = settingsService != null ? settingsService.pricePerSong(userId) : defaultPricePerSong;
        // Dynamic tiers by Spotify popularity: 0-40 => 1 coin, 41-70 => 2 coins, 71-100 => 3 coins
        int popularity = 0;
        try {
            popularity = spotifyService.getTrackPopularity(session, track.getId());
            pricePerSong = (popularity <= 40) ? 1 : (popularity <= 70 ? 2 : 3);
        } catch (Exception ignore) {}
        if (pricePerSong <= 0) pricePerSong = defaultPricePerSong;
        if (u.getCoins() < pricePerSong) {
            return ResponseEntity.status(402).body("Saldo insuficiente");
        }
        u.setCoins(u.getCoins() - pricePerSong);
        users.save(u);
        QueueItem qi = new QueueItem();
        qi.setTrackId(track.getId());
        qi.setTitle(track.getTitle());
        qi.setArtists(String.join(", ", track.getArtists()));
        qi.setAlbum(track.getAlbum());
        qi.setImageUrl(track.getImageUrl());
    qi.setDurationMs(track.getDurationMs() == null ? null : track.getDurationMs().intValue());
        qi.setUri(track.getUri());
        qi.setChargedPrice(pricePerSong);
        qi.setPopularity(popularity);
        QueueItem saved = repo.save(qi);
        return ResponseEntity.created(URI.create("/queue/" + saved.getId())).body(saved);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clear(HttpSession session) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        Long userId = (Long) session.getAttribute("userId");
        try {
            subscriptionService.requireActive(userId);
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
        }
        repo.deleteAll();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(HttpSession session, @PathVariable("id") Long id) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        Long userId = (Long) session.getAttribute("userId");
        try {
            subscriptionService.requireActive(userId);
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
        }
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

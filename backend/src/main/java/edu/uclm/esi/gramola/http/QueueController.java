package edu.uclm.esi.gramola.http;

/**
 * Controlador REST de la cola de reproducción: listar, añadir y eliminar canciones en cola.
 */

import edu.uclm.esi.gramola.dao.QueueItemRepository;
import edu.uclm.esi.gramola.dao.SongPaymentRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dto.TrackDTO;
import edu.uclm.esi.gramola.entities.QueueItem;
import edu.uclm.esi.gramola.entities.SongPayment;
import edu.uclm.esi.gramola.entities.User;
import org.springframework.beans.factory.annotation.Value;
import edu.uclm.esi.gramola.services.SettingsService;
import edu.uclm.esi.gramola.services.SubscriptionService;
import edu.uclm.esi.gramola.services.SpotifyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import jakarta.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/queue")
public class QueueController {
    private final QueueItemRepository repo;
    private final SongPaymentRepository songPayments;
    private final UserRepository users;
    private final SettingsService settingsService;
    private final SubscriptionService subscriptionService;
    private final SpotifyService spotifyService;

    @Value("${app.pricePerSong:1}")
    private int defaultPricePerSong;

    public QueueController(QueueItemRepository repo, SongPaymentRepository songPayments, UserRepository users, SettingsService settingsService,
                           SubscriptionService subscriptionService, SpotifyService spotifyService) {
        this.repo = repo;
        this.songPayments = songPayments;
        this.users = users;
        this.settingsService = settingsService;
        this.subscriptionService = subscriptionService;
        this.spotifyService = spotifyService;
    }

    private Long requireSubscribedUser(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no iniciada");
        }
        Long userId = (Long) userIdObj;
        subscriptionService.requireActive(userId);
        return userId;
    }

    @GetMapping
    public ResponseEntity<?> list(HttpSession session) {
        Long userId = requireSubscribedUser(session);
        List<QueueItem> items = repo.findAllByUser_IdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<?> add(HttpSession session, @RequestBody TrackDTO track) {
        Long userId = requireSubscribedUser(session);
        User u = users.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
        int pricePerSong = settingsService != null ? settingsService.pricePerSong(userId) : defaultPricePerSong;
        int popularity = 0;
        try {
            popularity = spotifyService.getTrackPopularity(session, track.getId());
            pricePerSong = (popularity <= 40) ? 1 : (popularity <= 70 ? 2 : 3);
        } catch (Exception ignore) {}
        if (pricePerSong <= 0) pricePerSong = defaultPricePerSong;
        SongPayment payment = songPayments.findFirstByUserIdAndTrackIdAndStatusAndConsumedAtIsNullOrderByConfirmedAtDesc(
            userId,
            track.getId(),
            SongPayment.Status.CONFIRMED
        ).orElseThrow(() -> new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
            "Debes pagar esta canción antes de añadirla a la cola"));
        if (!track.getId().equals(payment.getTrackId())) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "El pago no corresponde a esta canción");
        }
        if (payment.getAmountEur() < pricePerSong) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "El importe pagado no cubre esta canción");
        }
        QueueItem qi = new QueueItem();
        qi.setUser(u);
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
        payment.setStatus(SongPayment.Status.CONSUMED);
        payment.setConsumedAt(java.time.Instant.now());
        songPayments.save(payment);
        return ResponseEntity.created(URI.create("/queue/" + saved.getId())).body(saved);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clear(HttpSession session) {
        Long userId = requireSubscribedUser(session);
        repo.deleteAllByUser_Id(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(HttpSession session, @PathVariable("id") Long id) {
        Long userId = requireSubscribedUser(session);
        if (!repo.existsByIdAndUser_Id(id, userId)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

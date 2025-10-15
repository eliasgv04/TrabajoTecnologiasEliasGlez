package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dao.QueueItemRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dto.TrackDTO;
import edu.uclm.esi.gramola.entities.QueueItem;
import edu.uclm.esi.gramola.entities.User;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.pricePerSong:1}")
    private int pricePerSong;

    public QueueController(QueueItemRepository repo, UserRepository users) {
        this.repo = repo;
        this.users = users;
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
        User u = users.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
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
        QueueItem saved = repo.save(qi);
        return ResponseEntity.created(URI.create("/queue/" + saved.getId())).body(saved);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clear(HttpSession session) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        repo.deleteAll();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(HttpSession session, @PathVariable("id") Long id) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

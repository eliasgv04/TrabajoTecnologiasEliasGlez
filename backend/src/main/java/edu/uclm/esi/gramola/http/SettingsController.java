package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.entities.BarSettings;
import edu.uclm.esi.gramola.services.SettingsService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/settings")
public class SettingsController {
    private final SettingsService settings;

    public SettingsController(SettingsService settings) {
        this.settings = settings;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> get(HttpSession session) {
        Long userId = requireSession(session);
        BarSettings s = settings.getOrCreate(userId);
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("pricePerSong", s.getPricePerSong());
        resp.put("spotifyPlaylistUri", s.getSpotifyPlaylistUri()); // puede ser null; Jackson lo serializa bien
        return resp;
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> update(HttpSession session, @RequestBody Map<String, Object> body) {
        Long userId = requireSession(session);
        Integer price = (Integer) body.getOrDefault("pricePerSong", null);
        String playlist = (String) body.getOrDefault("spotifyPlaylistUri", null);
        BarSettings s = settings.getOrCreate(userId);
        if (price != null) {
            s = settings.updatePricePerSong(userId, price);
        }
        if (playlist != null) {
            s = settings.updatePlaylist(userId, playlist);
        }
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("pricePerSong", s.getPricePerSong());
        resp.put("spotifyPlaylistUri", s.getSpotifyPlaylistUri());
        return resp;
    }

    private Long requireSession(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        return (Long) userIdObj;
    }
}

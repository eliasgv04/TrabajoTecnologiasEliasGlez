package edu.uclm.esi.gramola.http;

/**
 * Controlador REST de música: búsqueda de canciones y obtención de tracks/playlists desde Spotify.
 */

import edu.uclm.esi.gramola.dto.TrackDTO;
import edu.uclm.esi.gramola.services.SpotifyClient;
import edu.uclm.esi.gramola.services.SpotifyService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/music")
public class MusicController {
    private final SpotifyClient spotify;
    private final SpotifyService spotifyService;

    public MusicController(SpotifyClient spotify, SpotifyService spotifyService) {
        this.spotify = spotify;
        this.spotifyService = spotifyService;
    }

    @GetMapping("/search")
        public ResponseEntity<?> search(@RequestParam(name = "q", required = true) String q) {
        if (q == null || q.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Parámetro q requerido");
        }
            return ResponseEntity.ok(spotify.searchTracks(q.trim()));
    }

    @GetMapping("/tracks/{id}")
    public TrackDTO track(@PathVariable("id") String id) {
        return spotify.getTrackById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Track no encontrado"));
    }

    @GetMapping("/playlist")
    public ResponseEntity<?> playlist(HttpSession session, @RequestParam("uri") String uri) {
        if (uri == null || uri.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Parámetro uri requerido");
        }
        // Prefer the user's Spotify OAuth token when available (more reliable for some playlists).
        try {
            String userToken = spotifyService.ensureAccessToken(session);
            return ResponseEntity.ok(spotify.getPlaylistTracksWithUserToken(uri.trim(), userToken));
        } catch (Exception ignored) {
            return ResponseEntity.ok(spotify.getPlaylistTracks(uri.trim()));
        }
    }
}

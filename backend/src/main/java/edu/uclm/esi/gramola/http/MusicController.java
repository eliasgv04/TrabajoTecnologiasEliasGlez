package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dto.TrackDTO;
import edu.uclm.esi.gramola.services.SpotifyClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/music")
public class MusicController {
    private final SpotifyClient spotify;

    public MusicController(SpotifyClient spotify) {
        this.spotify = spotify;
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
}

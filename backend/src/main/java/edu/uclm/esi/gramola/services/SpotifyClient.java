package edu.uclm.esi.gramola.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uclm.esi.gramola.dto.TrackDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class SpotifyClient {
    private static final Logger log = LoggerFactory.getLogger(SpotifyClient.class);

    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${spotify.clientId:${spring.security.oauth2.client.registration.spotify.client-id:}}")
    private String clientId;

    @Value("${spotify.clientSecret:${spring.security.oauth2.client.registration.spotify.client-secret:}}")
    private String clientSecret;

    private String appAccessToken;
    private Instant appTokenExpiresAt = Instant.EPOCH;

    public List<TrackDTO> searchTracks(String query) {
        ensureAppToken();
        String url = "https://api.spotify.com/v1/search?type=track&limit=10&q=" + urlEncode(query);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appAccessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> res = http.exchange(url, HttpMethod.GET, req, String.class);
            if (!res.getStatusCode().is2xxSuccessful()) {
                log.warn("Spotify search non-2xx: {}", res.getStatusCode());
                return List.of();
            }
            JsonNode root = mapper.readTree(res.getBody());
            JsonNode items = root.path("tracks").path("items");
            List<TrackDTO> out = new ArrayList<>();
            for (JsonNode t : items) {
                out.add(toDto(t));
            }
            return out;
        } catch (Exception e) {
            log.error("Spotify search error", e);
            return List.of();
        }
    }

    public Optional<TrackDTO> getTrackById(String id) {
        ensureAppToken();
        String url = "https://api.spotify.com/v1/tracks/" + id;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appAccessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> res = http.exchange(url, HttpMethod.GET, req, String.class);
            if (!res.getStatusCode().is2xxSuccessful()) {
                return Optional.empty();
            }
            JsonNode node = mapper.readTree(res.getBody());
            return Optional.of(toDto(node));
        } catch (Exception e) {
            log.error("Spotify track error", e);
            return Optional.empty();
        }
    }

    public List<TrackDTO> getPlaylistTracks(String uriOrUrl) {
        ensureAppToken();
        String playlistId = extractPlaylistId(uriOrUrl);
        if (playlistId == null || playlistId.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "URI de playlist inválida"
            );
        }
        String url = "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks?limit=50";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appAccessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> res = http.exchange(url, HttpMethod.GET, req, String.class);
            if (!res.getStatusCode().is2xxSuccessful()) {
                log.warn("Spotify playlist non-2xx: {}", res.getStatusCode());
                return List.of();
            }
            JsonNode root = mapper.readTree(res.getBody());
            JsonNode items = root.path("items");
            if (items == null || !items.isArray()) {
                log.warn("Spotify playlist items missing or not array");
                return List.of();
            }
            List<TrackDTO> out = new ArrayList<>();
            for (JsonNode item : items) {
                if (item == null || item.isNull() || item.isMissingNode()) continue;
                JsonNode t = item.path("track");
                if (t != null && !t.isMissingNode() && !t.isNull()) {
                    try { out.add(toDto(t)); } catch (Exception ex) { log.debug("Skipping track due to parse issue", ex); }
                }
            }
            return out;
        } catch (HttpStatusCodeException e) {
            int code = e.getStatusCode().value();
            // Common cases: invalid playlist id (404), private playlist (403), bad token (401)
            if (code == 404) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Playlist no encontrada"
                );
            }
            if (code == 401 || code == 403) {
                // For client-credentials token, 401/403 usually means invalid credentials or private playlist.
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "No se pudo acceder a la playlist (¿es privada?)"
                );
            }
            if (code == 429) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_GATEWAY,
                        "Spotify está limitando peticiones (rate limit). Intenta de nuevo."
                );
            }
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                "Spotify devolvió error " + code
            );
        } catch (Exception e) {
            log.error("Spotify playlist error", e);
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_GATEWAY,
                "No se pudo leer la playlist de Spotify"
            );
        }
    }

    public List<TrackDTO> getPlaylistTracksWithUserToken(String uriOrUrl, String userAccessToken) {
        String playlistId = extractPlaylistId(uriOrUrl);
        if (playlistId == null || playlistId.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "URI de playlist inválida"
            );
        }
        String url = "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks?limit=50";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userAccessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> res = http.exchange(url, HttpMethod.GET, req, String.class);
            JsonNode root = mapper.readTree(res.getBody());
            JsonNode items = root.path("items");
            if (items == null || !items.isArray()) return List.of();
            List<TrackDTO> out = new ArrayList<>();
            for (JsonNode item : items) {
                if (item == null || item.isNull() || item.isMissingNode()) continue;
                JsonNode t = item.path("track");
                if (t != null && !t.isMissingNode() && !t.isNull()) {
                    try { out.add(toDto(t)); } catch (Exception ex) { log.debug("Skipping track due to parse issue", ex); }
                }
            }
            return out;
        } catch (HttpStatusCodeException e) {
            int code = e.getStatusCode().value();
            if (code == 404) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Playlist no encontrada"
                );
            }
            if (code == 401 || code == 403) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "No se pudo acceder a la playlist (Spotify)"
                );
            }
            if (code == 429) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_GATEWAY,
                        "Spotify está limitando peticiones (rate limit). Intenta de nuevo."
                );
            }
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Spotify devolvió error " + code
            );
        } catch (Exception e) {
            log.error("Spotify playlist (user token) error", e);
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "No se pudo leer la playlist de Spotify"
            );
        }
    }

    private String extractPlaylistId(String uriOrUrl) {
        if (uriOrUrl == null) return null;
        String s = uriOrUrl.trim();
        try {
            if (s.startsWith("spotify:playlist:")) {
                String id = s.substring("spotify:playlist:".length());
                int slash = id.indexOf('/');
                if (slash >= 0) id = id.substring(0, slash);
                id = id.replaceAll("[^A-Za-z0-9]", "");
                return id;
            }
            if (s.contains("open.spotify.com/playlist/")) {
                // e.g. https://open.spotify.com/playlist/{id}?si=...
                String after = s.substring(s.indexOf("/playlist/") + "/playlist/".length());
                int q = after.indexOf('?');
                String id = q >= 0 ? after.substring(0, q) : after;
                int slash = id.indexOf('/');
                if (slash >= 0) id = id.substring(0, slash);
                id = id.replaceAll("[^A-Za-z0-9]", "");
                return id;
            }
            // allow raw id
            if (s.matches("[A-Za-z0-9]{10,}")) return s;
        } catch (Exception ignore) {}
        return null;
    }

    private void ensureAppToken() {
        if (appAccessToken != null && Instant.now().isBefore(appTokenExpiresAt.minusSeconds(30))) {
            return;
        }
        String effClientId = getEffectiveClientId();
        String effClientSecret = getEffectiveClientSecret();
        if (effClientId == null || effClientId.isBlank() || effClientSecret == null || effClientSecret.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Faltan credenciales de Spotify: configura spotify.clientId/spotify.clientSecret o variables de entorno SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET");
        }
        String url = "https://accounts.spotify.com/api/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String creds = Base64.getEncoder().encodeToString((effClientId + ":" + effClientSecret).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + creds);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        try {
            ResponseEntity<String> res = http.postForEntity(url, new HttpEntity<>(form, headers), String.class);
            if (!res.getStatusCode().is2xxSuccessful()) {
                throw new RestClientException("Bad token response: " + res.getStatusCode());
            }
            JsonNode node = mapper.readTree(res.getBody());
            this.appAccessToken = node.path("access_token").asText();
            int expiresIn = node.path("expires_in").asInt(3600);
            this.appTokenExpiresAt = Instant.now().plusSeconds(expiresIn);
            log.info("Spotify app token acquired (expires in {}s)", expiresIn);
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "No se pudo obtener el token de Spotify");
        }
    }

    private static String urlEncode(String s) {
        return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String getEffectiveClientId() {
        if (this.clientId != null && !this.clientId.isBlank()) return this.clientId;
        String env = System.getenv("SPOTIFY_CLIENT_ID");
        return (env != null && !env.isBlank()) ? env : null;
    }

    private String getEffectiveClientSecret() {
        if (this.clientSecret != null && !this.clientSecret.isBlank()) return this.clientSecret;
        String env = System.getenv("SPOTIFY_CLIENT_SECRET");
        return (env != null && !env.isBlank()) ? env : null;
    }

    private TrackDTO toDto(JsonNode t) {
        String id = t.path("id").asText();
        String title = t.path("name").asText();
        List<String> artists = new ArrayList<>();
        for (JsonNode a : t.path("artists")) artists.add(a.path("name").asText());
        String album = t.path("album").path("name").asText();
        String imageUrl = null;
        JsonNode images = t.path("album").path("images");
        if (images.isArray() && images.size() > 0) {
            imageUrl = images.get(images.size() - 1).path("url").asText(); // la más pequeña
        }
        Long durationMs = t.path("duration_ms").isNumber() ? t.path("duration_ms").asLong() : null;
        String previewUrl = t.path("preview_url").isMissingNode() ? null : t.path("preview_url").asText(null);
        String uri = t.path("uri").asText();
        return new TrackDTO(id, title, artists, album, imageUrl, durationMs, previewUrl, uri);
    }
}

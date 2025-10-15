package edu.uclm.esi.gramola.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/spotify")
public class SpotifyAuthController {
    private static final Logger log = LoggerFactory.getLogger(SpotifyAuthController.class);

    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${spotify.clientId:${spring.security.oauth2.client.registration.spotify.client-id:}}")
    private String clientId;

    @Value("${spotify.clientSecret:${spring.security.oauth2.client.registration.spotify.client-secret:}}")
    private String clientSecret;

    @Value("${spotify.redirectUri:http://localhost:8000/spotify/callback}")
    private String redirectUri;

    private String ensureAccessToken(HttpSession session) {
        String access = (String) session.getAttribute("spotify_access_token");
        Instant exp = (Instant) session.getAttribute("spotify_expires_at");
        if (access != null && exp != null && Instant.now().isBefore(exp.minusSeconds(30))) {
            return access;
        }
        String refresh = (String) session.getAttribute("spotify_refresh_token");
        if (refresh == null) throw new RuntimeException("No hay token de Spotify en sesión");
        // refresh
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + basic);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refresh);
        ResponseEntity<String> res = http.postForEntity("https://accounts.spotify.com/api/token", new HttpEntity<>(form, headers), String.class);
        if (!res.getStatusCode().is2xxSuccessful())
            throw new RuntimeException("No se pudo refrescar el token de Spotify");
        try {
            JsonNode node = mapper.readTree(res.getBody());
            String newAccess = node.path("access_token").asText();
            int expiresIn = node.path("expires_in").asInt(3600);
            session.setAttribute("spotify_access_token", newAccess);
            session.setAttribute("spotify_expires_at", Instant.now().plusSeconds(expiresIn));
            return newAccess;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/login")
    public ResponseEntity<?> login(HttpSession session, @RequestParam(value = "returnUrl", required = false) String returnUrl) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return ResponseEntity.status(500).body("Faltan credenciales de Spotify");
        }
        String state = UUID.randomUUID().toString();
        session.setAttribute("spotify_oauth_state", state);
        if (returnUrl != null) session.setAttribute("spotify_return_url", returnUrl);
        String scopes = String.join(" ", new String[]{
                "user-read-playback-state",
                "user-modify-playback-state",
                "streaming"
        });
        String url = "https://accounts.spotify.com/authorize?client_id=" + clientId
                + "&response_type=code"
                + "&redirect_uri=" + java.net.URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&scope=" + java.net.URLEncoder.encode(scopes, StandardCharsets.UTF_8)
                + "&state=" + state;
        return ResponseEntity.status(302).location(URI.create(url)).build();
    }

    @GetMapping("/callback")
    public ResponseEntity<?> callback(HttpSession session, @RequestParam("code") String code, @RequestParam("state") String state) {
        String expected = (String) session.getAttribute("spotify_oauth_state");
        if (expected == null || !expected.equals(state)) {
            return ResponseEntity.status(400).body("Estado inválido");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + basic);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        ResponseEntity<String> res = http.postForEntity("https://accounts.spotify.com/api/token", new HttpEntity<>(form, headers), String.class);
        if (!res.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(400).body("No se pudo obtener el token de Spotify");
        }
        try {
            JsonNode node = mapper.readTree(res.getBody());
            String access = node.path("access_token").asText();
            String refresh = node.path("refresh_token").asText();
            int expiresIn = node.path("expires_in").asInt(3600);
            session.setAttribute("spotify_access_token", access);
            session.setAttribute("spotify_refresh_token", refresh);
            session.setAttribute("spotify_expires_at", Instant.now().plusSeconds(expiresIn));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error parseando token de Spotify");
        }
        String returnUrl = (String) session.getAttribute("spotify_return_url");
        if (returnUrl == null || returnUrl.isBlank()) returnUrl = "http://localhost:4200/";
        return ResponseEntity.status(302).location(URI.create(returnUrl)).build();
    }

    @GetMapping("/token")
    public ResponseEntity<?> token(HttpSession session) {
        try {
            String token = ensureAccessToken(session);
            Instant exp = (Instant) session.getAttribute("spotify_expires_at");
            long expiresIn = exp != null ? Math.max(0, exp.getEpochSecond() - Instant.now().getEpochSecond()) : 0;
            return ResponseEntity.ok(Map.of("accessToken", token, "expiresIn", expiresIn));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("No autenticado con Spotify");
        }
    }

    @PutMapping("/transfer")
    public ResponseEntity<?> transfer(HttpSession session, @RequestBody Map<String, Object> body) {
        try {
            String token = ensureAccessToken(session);
            String deviceId = (String) body.get("deviceId");
            boolean play = Boolean.TRUE.equals(body.get("play"));
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            h.setContentType(MediaType.APPLICATION_JSON);
            String payload = "{\"device_ids\":[\"" + deviceId + "\"],\"play\":" + (play ? "true" : "false") + "}";
            ResponseEntity<Void> res = http.exchange("https://api.spotify.com/v1/me/player", HttpMethod.PUT, new HttpEntity<>(payload, h), Void.class);
            return ResponseEntity.status(res.getStatusCode()).build();
        } catch (Exception e) {
            log.warn("transfer error", e);
            return ResponseEntity.status(500).body("Error transfiriendo reproducción");
        }
    }

    @PostMapping("/play")
    public ResponseEntity<?> play(HttpSession session, @RequestBody Map<String, Object> body) {
        try {
            String token = ensureAccessToken(session);
            String deviceId = (String) body.get("deviceId");
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            h.setContentType(MediaType.APPLICATION_JSON);
            String payload = mapper.writeValueAsString(body); // forward uris/context_uri
            String url = "https://api.spotify.com/v1/me/player/play" + (deviceId != null ? ("?device_id=" + deviceId) : "");
            ResponseEntity<Void> res = http.exchange(url, HttpMethod.PUT, new HttpEntity<>(payload, h), Void.class);
            return ResponseEntity.status(res.getStatusCode()).build();
        } catch (Exception e) {
            log.warn("play error", e);
            return ResponseEntity.status(500).body("Error al reproducir");
        }
    }

    @PutMapping("/pause")
    public ResponseEntity<?> pause(HttpSession session, @RequestBody(required = false) Map<String, Object> body) {
        try {
            String token = ensureAccessToken(session);
            String deviceId = body != null ? (String) body.get("deviceId") : null;
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            String url = "https://api.spotify.com/v1/me/player/pause" + (deviceId != null ? ("?device_id=" + deviceId) : "");
            ResponseEntity<Void> res = http.exchange(url, HttpMethod.PUT, new HttpEntity<>(h), Void.class);
            return ResponseEntity.status(res.getStatusCode()).build();
        } catch (Exception e) {
            log.warn("pause error", e);
            return ResponseEntity.status(500).body("Error al pausar");
        }
    }
}

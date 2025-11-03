package edu.uclm.esi.gramola.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
public class SpotifyService {
    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${spotify.clientId:${spring.security.oauth2.client.registration.spotify.client-id:}}")
    private String clientId;

    @Value("${spotify.clientSecret:${spring.security.oauth2.client.registration.spotify.client-secret:}}")
    private String clientSecret;

    private volatile String appAccessToken;
    private volatile Instant appAccessExpiresAt;

    public String ensureAccessToken(HttpSession session) {
        String access = (String) session.getAttribute("spotify_access_token");
        Instant exp = (Instant) session.getAttribute("spotify_expires_at");
        if (access != null && exp != null && Instant.now().isBefore(exp.minusSeconds(30))) {
            return access;
        }
        String refresh = (String) session.getAttribute("spotify_refresh_token");
        if (refresh == null) throw new RuntimeException("No hay token de Spotify en sesión");
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

    private String ensureAppToken() {
        if (appAccessToken != null && appAccessExpiresAt != null && Instant.now().isBefore(appAccessExpiresAt.minusSeconds(30))) {
            return appAccessToken;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + basic);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        ResponseEntity<String> res = http.postForEntity("https://accounts.spotify.com/api/token", new HttpEntity<>(form, headers), String.class);
        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("No se pudo obtener token de app de Spotify");
        }
        try {
            JsonNode node = mapper.readTree(res.getBody());
            String token = node.path("access_token").asText();
            int expiresIn = node.path("expires_in").asInt(3600);
            this.appAccessToken = token;
            this.appAccessExpiresAt = Instant.now().plusSeconds(expiresIn);
            return token;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public int getTrackPopularity(HttpSession session, String trackId) {
        String token;
        try {
            token = ensureAccessToken(session);
        } catch (Exception ignored) {
            token = ensureAppToken();
        }
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        ResponseEntity<String> res = http.exchange("https://api.spotify.com/v1/tracks/" + trackId, HttpMethod.GET, new HttpEntity<>(h), String.class);
        if (!res.getStatusCode().is2xxSuccessful()) return 0;
        try {
            JsonNode node = mapper.readTree(res.getBody());
            return node.path("popularity").asInt(0);
        } catch (Exception e) {
            return 0;
        }
    }
}

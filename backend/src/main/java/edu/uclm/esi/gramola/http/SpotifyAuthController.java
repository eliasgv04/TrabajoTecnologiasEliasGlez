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
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;

import edu.uclm.esi.gramola.services.SubscriptionService;
import edu.uclm.esi.gramola.services.SpotifyService;

@RestController
@RequestMapping("/spotify")
public class SpotifyAuthController {
    private static final Logger log = LoggerFactory.getLogger(SpotifyAuthController.class);

    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();
    private final SubscriptionService subscriptionService;
    private final SpotifyService spotifyService;

    @Value("${spotify.clientId:${spring.security.oauth2.client.registration.spotify.client-id:}}")
    private String clientId;

    @Value("${spotify.clientSecret:${spring.security.oauth2.client.registration.spotify.client-secret:}}")
    private String clientSecret;

    @Value("${spotify.stateSecret:}")
    private String stateSecret;

    // Important for local dev with Angular proxy:
    // If you start OAuth from https://localhost:4200 via /api, the session cookie lives on :4200.
    // The callback must also come back through :4200 (/api/...) so the same cookie is sent.
    @Value("${spotify.redirectUri:https://127.0.0.1:8000/spotify/callback}")
    private String redirectUri;

    public SpotifyAuthController(SubscriptionService subscriptionService, SpotifyService spotifyService) {
        this.subscriptionService = subscriptionService;
        this.spotifyService = spotifyService;
    }

    private record OAuthState(long userId, String returnUrl, long exp) {
    }

    private static String b64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] b64UrlDecode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }

    private String sign(String payloadB64) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(stateSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return b64Url(mac.doFinal(payloadB64.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String createState(long userId, String returnUrl) {
        if (stateSecret == null || stateSecret.isBlank()) {
            throw new RuntimeException("Falta spotify.stateSecret");
        }
        long exp = Instant.now().plus(10, ChronoUnit.MINUTES).getEpochSecond();
        OAuthState payload = new OAuthState(userId, returnUrl, exp);
        try {
            String payloadB64 = b64Url(mapper.writeValueAsBytes(payload));
            String sigB64 = sign(payloadB64);
            return payloadB64 + "." + sigB64;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private OAuthState parseState(String state) {
        if (stateSecret == null || stateSecret.isBlank()) {
            throw new RuntimeException("Falta spotify.stateSecret");
        }
        String[] parts = state.split("\\.");
        if (parts.length != 2) return null;
        String payloadB64 = parts[0];
        String sigB64 = parts[1];
        String expectedSigB64 = sign(payloadB64);
        if (!MessageDigest.isEqual(sigB64.getBytes(StandardCharsets.UTF_8), expectedSigB64.getBytes(StandardCharsets.UTF_8))) {
            return null;
        }
        try {
            OAuthState payload = mapper.readValue(b64UrlDecode(payloadB64), OAuthState.class);
            if (payload.exp() <= Instant.now().getEpochSecond()) return null;
            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/login")
    public ResponseEntity<?> login(HttpSession session, @RequestParam(value = "returnUrl", required = false) String returnUrl) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return ResponseEntity.status(500).body("Faltan credenciales de Spotify");
        }
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(401).body("Sesión no iniciada");
        }
        long userId = (Long) userIdObj;
        String safeReturnUrl = (returnUrl == null || returnUrl.isBlank()) ? "https://localhost:4200/queue" : returnUrl;
        String state = createState(userId, safeReturnUrl);
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
        OAuthState parsed = parseState(state);
        if (parsed == null) {
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
            spotifyService.storeUserTokens(parsed.userId(), access, refresh, Instant.now().plusSeconds(expiresIn));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error parseando token de Spotify");
        }
        String returnUrl = (parsed.returnUrl() == null || parsed.returnUrl().isBlank()) ? "https://localhost:4200/queue" : parsed.returnUrl();
        return ResponseEntity.status(302).location(URI.create(returnUrl)).build();
    }

    @GetMapping("/token")
    public ResponseEntity<?> token(HttpSession session) {
        try {
            String token = spotifyService.ensureAccessToken(session);
            Object userIdObj = session.getAttribute("userId");
            long expiresIn = 0;
            if (userIdObj != null) {
                Instant exp = spotifyService.getExpiresAt((Long) userIdObj);
                expiresIn = exp != null ? Math.max(0, exp.getEpochSecond() - Instant.now().getEpochSecond()) : 0;
            }
            return ResponseEntity.ok(Map.of("accessToken", token, "expiresIn", expiresIn));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("No autenticado con Spotify");
        }
    }

    @PutMapping("/transfer")
    public ResponseEntity<?> transfer(HttpSession session, @RequestBody Map<String, Object> body) {
        try {
            Object userIdObj = session.getAttribute("userId");
            if (userIdObj == null) return ResponseEntity.status(401).body("Sesión no iniciada");
            subscriptionService.requireActive((Long) userIdObj);
            String token = spotifyService.ensureAccessToken(session);
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
    public ResponseEntity<?> play(HttpSession session, @RequestBody Map<String, Object> body) {        try {
            Object userIdObj = session.getAttribute("userId");
            if (userIdObj == null) return ResponseEntity.status(401).body("Sesión no iniciada");
            subscriptionService.requireActive((Long) userIdObj);
            String token = spotifyService.ensureAccessToken(session);
            String deviceId = body != null ? (String) body.get("deviceId") : null;
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            h.setContentType(MediaType.APPLICATION_JSON);
            // Spotify API does NOT accept deviceId in the JSON payload (it goes in the query param).
            Map<String, Object> payloadMap = body == null ? Map.of() : new java.util.HashMap<>(body);
            payloadMap.remove("deviceId");
            String payload = mapper.writeValueAsString(payloadMap);
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
            Object userIdObj = session.getAttribute("userId");
            if (userIdObj == null) return ResponseEntity.status(401).body("Sesión no iniciada");
            subscriptionService.requireActive((Long) userIdObj);
            String token = spotifyService.ensureAccessToken(session);
            String deviceId = body != null ? (String) body.get("deviceId") : null;
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            String url = "https://api.spotify.com/v1/me/player/pause" + (deviceId != null ? ("?device_id=" + deviceId) : "");
            ResponseEntity<Void> res = http.exchange(url, HttpMethod.PUT, new HttpEntity<>(null, h), Void.class);
            return ResponseEntity.status(res.getStatusCode()).build();
        } catch (Exception e) {
            log.warn("pause error", e);
            return ResponseEntity.status(500).body("Error al pausar");
        }
    }
}

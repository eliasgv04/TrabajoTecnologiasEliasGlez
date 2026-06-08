package edu.uclm.esi.gramola.services;

import edu.uclm.esi.gramola.entities.Url;
import edu.uclm.esi.gramola.repositories.UrlRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UrlService {

    // URLs de respaldo hardcodeadas: se usan solo si la tabla 'urls' de la BD está vacía o no contiene la clave pedida.
    // En producción estas valores deberían estar siempre en BD; aquí actúan como última red de seguridad.
    private static final Map<String, String> DEFAULT_URLS = Map.ofEntries(
            Map.entry("Spotify API", "https://api.spotify.com"),
            Map.entry("Spotify Accounts", "https://accounts.spotify.com"),
            Map.entry("Local Frontend", "https://localhost:4200"),
            Map.entry("Local Backend", "https://localhost:8000"),
            Map.entry("Login Page", "https://localhost:4200/login"),
            Map.entry("Queue Page", "https://localhost:4200/queue"),
            Map.entry("Plans Page", "https://localhost:4200/plans"),
            Map.entry("Password Reset", "https://localhost:4200/reset"),
            Map.entry("Verified Login Redirect", "https://localhost:4200/login?verified=1&next=/plans"),
            Map.entry("User Verify Endpoint", "https://localhost:8000/users/verify"),
            Map.entry("User Login Endpoint", "https://localhost:8000/users/login"),
            Map.entry("Auth Callback", "https://127.0.0.1:8000/spotify/callback")
    );

    private final UrlRepository urlRepository;

    // Caché en memoria: se carga una vez al arrancar y evita consultar la BD en cada petición.
    // volatile garantiza visibilidad entre hilos si Spring recargase el contexto.
    private volatile Map<String, String> urlsByName = Map.of();

    public UrlService(UrlRepository urlRepository) {
        this.urlRepository = urlRepository;
    }

    // Se ejecuta automáticamente después de que Spring inyecta las dependencias.
    // Lee todas las filas de la tabla 'urls' y las carga en el mapa en memoria.
    @PostConstruct
    public void loadUrls() {
        List<Url> urls = urlRepository.findAll();
        Map<String, String> loaded = new HashMap<>();
        for (Url url : urls) {
            if (url == null || url.getName() == null || url.getUrl() == null) continue;
            String name = url.getName().trim();
            String value = url.getUrl().trim();
            if (!name.isEmpty() && !value.isEmpty()) loaded.put(name, value);
        }
        // Map.copyOf produce un mapa inmutable, lo que evita modificaciones accidentales en tiempo de ejecución.
        urlsByName = Map.copyOf(loaded);
    }

    // Devuelve la URL asociada al nombre dado.
    // Primero busca en la caché cargada de BD; si no la encuentra, cae en los valores por defecto.
    public String getRequired(String name) {
        return Optional.ofNullable(urlsByName.get(name))
                .filter(value -> !value.isBlank())
                .orElse(DEFAULT_URLS.get(name));
    }

    // Devuelve la URL base del nombre dado concatenada con la ruta proporcionada.
    // Garantiza que no haya doble barra entre la base y la ruta (ej: "https://api.spotify.com" + "/v1/me").
    public String withPath(String name, String path) {
        String base = normalize(getRequired(name));
        if (path == null || path.isBlank()) return base;
        return base + (path.startsWith("/") ? path : "/" + path);
    }

    // Elimina la barra final de una URL si la tiene, para evitar dobles barras al concatenar rutas.
    private String normalize(String url) {
        if (url == null) return null;
        String trimmed = url.trim();
        if (trimmed.endsWith("/")) return trimmed.substring(0, trimmed.length() - 1);
        return trimmed;
    }
}
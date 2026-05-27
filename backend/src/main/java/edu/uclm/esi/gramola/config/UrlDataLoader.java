package edu.uclm.esi.gramola.config;

import edu.uclm.esi.gramola.entities.Url;
import edu.uclm.esi.gramola.repositories.UrlRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UrlDataLoader implements CommandLineRunner {

    private final UrlRepository urlRepository;

    public UrlDataLoader(UrlRepository urlRepository) {
        this.urlRepository = urlRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (urlRepository.count() == 0) {
            List<Url> urls = List.of(
                    create("Spotify API", "https://api.spotify.com"),
                    create("Spotify Accounts", "https://accounts.spotify.com"),
                    create("Spotify Web Player", "https://open.spotify.com"),
                    create("Local Frontend", "https://localhost:4200"),
                    create("Local Backend", "https://localhost:8000"),
                    create("Login Page", "https://localhost:4200/login"),
                    create("Queue Page", "https://localhost:4200/queue"),
                    create("Plans Page", "https://localhost:4200/plans"),
                    create("Password Reset", "https://localhost:4200/reset"),
                    create("Verified Login Redirect", "https://localhost:4200/login?verified=1&next=/plans"),
                    create("User Verify Endpoint", "https://localhost:8000/users/verify"),
                    create("User Login Endpoint", "https://localhost:8000/users/login"),
                    create("Auth Callback", "https://127.0.0.1:8000/spotify/callback")
            );
            urlRepository.saveAll(urls);
        }
    }

    private Url create(String name, String url) {
        Url u = new Url();
        u.setName(name);
        u.setUrl(url);
        return u;
    }
}

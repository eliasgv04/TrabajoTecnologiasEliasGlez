package edu.uclm.esi.gramola.services;

import edu.uclm.esi.gramola.dao.BarSettingsRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.BarSettings;
import edu.uclm.esi.gramola.entities.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {
    private final BarSettingsRepository repo;
    private final UserRepository users;

    public SettingsService(BarSettingsRepository repo, UserRepository users) {
        this.repo = repo;
        this.users = users;
    }

    @Transactional
    public BarSettings getOrCreate(Long userId) {
        return repo.findByUserId(userId).orElseGet(() -> {
            User u = users.findById(userId).orElseThrow();
            BarSettings s = new BarSettings();
            s.setUser(u);
            s.setPricePerSong(1);
            return repo.save(s);
        });
    }

    @Transactional(readOnly = true)
    public int pricePerSong(Long userId) {
        return repo.findByUserId(userId).map(BarSettings::getPricePerSong).orElse(1);
    }

    @Transactional
    public BarSettings updatePricePerSong(Long userId, int price) {
        BarSettings s = getOrCreate(userId);
        s.setPricePerSong(Math.max(0, price));
        return repo.save(s);
    }

    @Transactional
    public BarSettings updatePlaylist(Long userId, String playlistUri) {
        BarSettings s = getOrCreate(userId);
        s.setSpotifyPlaylistUri(playlistUri);
        return repo.save(s);
    }
}

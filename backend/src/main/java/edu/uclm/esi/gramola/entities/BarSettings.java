package edu.uclm.esi.gramola.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bar_settings")
public class BarSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "price_per_song", nullable = false)
    private int pricePerSong = 1; // in coins

    @Column(name = "spotify_playlist_uri", length = 120)
    private String spotifyPlaylistUri;

    @Column(name = "bar_name", length = 120)
    private String barName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public int getPricePerSong() { return pricePerSong; }
    public void setPricePerSong(int pricePerSong) { this.pricePerSong = pricePerSong; }

    public String getSpotifyPlaylistUri() { return spotifyPlaylistUri; }
    public void setSpotifyPlaylistUri(String spotifyPlaylistUri) { this.spotifyPlaylistUri = spotifyPlaylistUri; }

    public String getBarName() { return barName; }
    public void setBarName(String barName) { this.barName = barName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

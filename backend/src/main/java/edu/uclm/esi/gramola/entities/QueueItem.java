package edu.uclm.esi.gramola.entities;

/**
 * Entidad JPA que representa un elemento de la cola de reproducción.
 */

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "queue_items")
public class QueueItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String trackId; // Spotify track id

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artists; // comma-joined

    @Column(nullable = false)
    private String album;

    private String imageUrl;
    private Integer durationMs;
    private String uri; // spotify:track:...

    // transparency: store what the user paid and the popularity used
    @Column(name = "charged_price")
    private Integer chargedPrice;

    @Column(name = "popularity")
    private Integer popularity;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTrackId() { return trackId; }
    public void setTrackId(String trackId) { this.trackId = trackId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getArtists() { return artists; }
    public void setArtists(String artists) { this.artists = artists; }
    public String getAlbum() { return album; }
    public void setAlbum(String album) { this.album = album; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getDurationMs() { return durationMs; }
    public void setDurationMs(Integer durationMs) { this.durationMs = durationMs; }
    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }
    public Integer getChargedPrice() { return chargedPrice; }
    public void setChargedPrice(Integer chargedPrice) { this.chargedPrice = chargedPrice; }
    public Integer getPopularity() { return popularity; }
    public void setPopularity(Integer popularity) { this.popularity = popularity; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

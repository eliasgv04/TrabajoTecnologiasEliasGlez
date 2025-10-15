package edu.uclm.esi.gramola.dto;

import java.util.List;

public class TrackDTO {
    private String id;
    private String title;
    private List<String> artists;
    private String album;
    private String imageUrl;
    private Long durationMs;
    private String previewUrl;
    private String uri;

    public TrackDTO() {}

    public TrackDTO(String id, String title, List<String> artists, String album, String imageUrl, Long durationMs, String previewUrl, String uri) {
        this.id = id;
        this.title = title;
        this.artists = artists;
        this.album = album;
        this.imageUrl = imageUrl;
        this.durationMs = durationMs;
        this.previewUrl = previewUrl;
        this.uri = uri;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public List<String> getArtists() { return artists; }
    public void setArtists(List<String> artists) { this.artists = artists; }

    public String getAlbum() { return album; }
    public void setAlbum(String album) { this.album = album; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }

    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }
}

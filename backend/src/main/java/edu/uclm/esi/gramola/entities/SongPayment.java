package edu.uclm.esi.gramola.entities;

/**
 * Entidad JPA para registrar pagos de canciones.
 */

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "song_payments")
public class SongPayment {
    public enum Status { PENDING, CONFIRMED, CONSUMED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @Column(nullable = false)
    private String trackId;

    @Column(nullable = false)
    private int amountEur;

    @Column(nullable = false, unique = true, length = 255)
    private String clientSecret;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant confirmedAt;
    private Instant consumedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTrackId() { return trackId; }
    public void setTrackId(String trackId) { this.trackId = trackId; }

    public int getAmountEur() { return amountEur; }
    public void setAmountEur(int amountEur) { this.amountEur = amountEur; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public Instant getConsumedAt() { return consumedAt; }
    public void setConsumedAt(Instant consumedAt) { this.consumedAt = consumedAt; }
}
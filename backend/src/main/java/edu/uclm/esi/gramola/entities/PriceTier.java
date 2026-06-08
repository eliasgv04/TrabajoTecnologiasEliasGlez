package edu.uclm.esi.gramola.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "price_tiers")
public class PriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "popularity_min", nullable = false)
    private int popularityMin;

    @Column(name = "popularity_max", nullable = false)
    private int popularityMax;

    @Column(name = "price_eur", nullable = false)
    private int priceEur;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getPopularityMin() { return popularityMin; }
    public void setPopularityMin(int popularityMin) { this.popularityMin = popularityMin; }

    public int getPopularityMax() { return popularityMax; }
    public void setPopularityMax(int popularityMax) { this.popularityMax = popularityMax; }

    public int getPriceEur() { return priceEur; }
    public void setPriceEur(int priceEur) { this.priceEur = priceEur; }
}

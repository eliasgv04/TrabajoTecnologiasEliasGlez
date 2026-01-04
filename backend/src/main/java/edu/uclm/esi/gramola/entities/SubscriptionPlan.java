package edu.uclm.esi.gramola.entities;

/**
 * Entidad JPA para definir un plan de suscripción.
 */

import jakarta.persistence.*;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // e.g., MONTHLY, ANNUAL

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private int priceEur; // precio en euros enteros para MVP

    @Column(nullable = false)
    private int durationMonths; // 1 para mensual, 12 para anual

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPriceEur() { return priceEur; }
    public void setPriceEur(int priceEur) { this.priceEur = priceEur; }

    public int getDurationMonths() { return durationMonths; }
    public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
}

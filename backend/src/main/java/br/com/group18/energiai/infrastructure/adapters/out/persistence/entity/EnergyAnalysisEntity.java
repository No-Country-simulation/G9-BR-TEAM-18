package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_energy_analysis")
public class EnergyAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "consumption_kwh", nullable = false, precision = 10, scale = 2)
    private BigDecimal consumptionKwh;

    @Column(name = "peak_hour_usage", nullable = false, precision = 1, scale = 0)
    private Integer peakHourUsage;

    @Column(name = "high_consumption_hours", nullable = false, precision = 4, scale = 2)
    private BigDecimal highConsumptionHours;

    @Column(name = "estimated_monthly_cost", precision = 10, scale = 2)
    private BigDecimal estimatedMonthlyCost;

    @Column(length = 50)
    private String category;

    @Column(precision = 5, scale = 2)
    private BigDecimal probability;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = "PENDENTE";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public BigDecimal getConsumptionKwh() {
        return consumptionKwh;
    }

    public void setConsumptionKwh(BigDecimal consumptionKwh) {
        this.consumptionKwh = consumptionKwh;
    }

    public Integer getPeakHourUsage() {
        return peakHourUsage;
    }

    public void setPeakHourUsage(Integer peakHourUsage) {
        this.peakHourUsage = peakHourUsage;
    }

    public BigDecimal getHighConsumptionHours() {
        return highConsumptionHours;
    }

    public void setHighConsumptionHours(BigDecimal highConsumptionHours) {
        this.highConsumptionHours = highConsumptionHours;
    }

    public BigDecimal getEstimatedMonthlyCost() {
        return estimatedMonthlyCost;
    }

    public void setEstimatedMonthlyCost(BigDecimal estimatedMonthlyCost) {
        this.estimatedMonthlyCost = estimatedMonthlyCost;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getProbability() {
        return probability;
    }

    public void setProbability(BigDecimal probability) {
        this.probability = probability;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

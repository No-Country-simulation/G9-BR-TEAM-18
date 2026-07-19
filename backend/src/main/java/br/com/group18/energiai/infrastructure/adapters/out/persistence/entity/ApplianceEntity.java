package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_appliance")
public class ApplianceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "appliance_category", length = 100)
    private String applianceCategory;

    @Column(name = "average_power_watts", nullable = false, precision = 10, scale = 2)
    private BigDecimal averagePowerWatts;

    @Column(name = "average_daily_use_hours", precision = 4, scale = 2)
    private BigDecimal averageDailyUseHours;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getApplianceCategory() {
        return applianceCategory;
    }

    public void setApplianceCategory(String applianceCategory) {
        this.applianceCategory = applianceCategory;
    }

    public BigDecimal getAveragePowerWatts() {
        return averagePowerWatts;
    }

    public void setAveragePowerWatts(BigDecimal averagePowerWatts) {
        this.averagePowerWatts = averagePowerWatts;
    }

    public BigDecimal getAverageDailyUseHours() {
        return averageDailyUseHours;
    }

    public void setAverageDailyUseHours(BigDecimal averageDailyUseHours) {
        this.averageDailyUseHours = averageDailyUseHours;
    }
}

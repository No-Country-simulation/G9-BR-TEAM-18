package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_analysis_appliance_snapshot")
public class AnalysisApplianceSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "appliance_name", nullable = false, length = 100)
    private String applianceName;

    @Column(name = "appliance_category", length = 100)
    private String applianceCategory;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "average_power_watts", nullable = false, precision = 10, scale = 2)
    private BigDecimal averagePowerWatts;

    @Column(name = "average_daily_use_hours", precision = 4, scale = 2)
    private BigDecimal averageDailyUseHours;

    @Column(name = "monthly_consumption_kwh", precision = 10, scale = 2)
    private BigDecimal monthlyConsumptionKwh;

    public AnalysisApplianceSnapshotEntity() {}

    public AnalysisApplianceSnapshotEntity(
            Long analysisId,
            String applianceName,
            String applianceCategory,
            Integer quantity,
            BigDecimal averagePowerWatts,
            BigDecimal averageDailyUseHours,
            BigDecimal monthlyConsumptionKwh) {
        this.analysisId = analysisId;
        this.applianceName = applianceName;
        this.applianceCategory = applianceCategory;
        this.quantity = quantity;
        this.averagePowerWatts = averagePowerWatts;
        this.averageDailyUseHours = averageDailyUseHours;
        this.monthlyConsumptionKwh = monthlyConsumptionKwh;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public String getApplianceName() {
        return applianceName;
    }

    public void setApplianceName(String applianceName) {
        this.applianceName = applianceName;
    }

    public String getApplianceCategory() {
        return applianceCategory;
    }

    public void setApplianceCategory(String applianceCategory) {
        this.applianceCategory = applianceCategory;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
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

    public BigDecimal getMonthlyConsumptionKwh() {
        return monthlyConsumptionKwh;
    }

    public void setMonthlyConsumptionKwh(BigDecimal monthlyConsumptionKwh) {
        this.monthlyConsumptionKwh = monthlyConsumptionKwh;
    }
}

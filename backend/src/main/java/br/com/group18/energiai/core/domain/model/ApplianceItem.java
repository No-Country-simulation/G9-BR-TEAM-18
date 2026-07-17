package br.com.group18.energiai.core.domain.model;

/** Represents an appliance selected by the user with its quantity. */
public class ApplianceItem {

    private ApplianceType type;
    private int quantity;

    public ApplianceItem() {}

    public ApplianceItem(ApplianceType type, int quantity) {
        this.type = type;
        this.quantity = quantity;
    }

    public ApplianceType getType() {
        return type;
    }

    public void setType(ApplianceType type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    /** Estimated daily consumption in kWh (watts * hours * quantity / 1000) */
    public double getDailyConsumptionKwh() {
        return (type.getPowerWatts() * type.getDailyUsageHours() * quantity) / 1000.0;
    }

    /** Estimated monthly consumption in kWh */
    public double getMonthlyConsumptionKwh() {
        return getDailyConsumptionKwh() * 30;
    }

    /** Total power in watts (power * quantity) */
    public double getTotalPowerWatts() {
        return type.getPowerWatts() * quantity;
    }
}

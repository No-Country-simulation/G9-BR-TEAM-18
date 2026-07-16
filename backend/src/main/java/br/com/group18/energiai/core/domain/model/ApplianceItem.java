package br.com.group18.energiai.core.domain.model;

/**
 * Representa um aparelho selecionado pelo usuário com sua quantidade.
 */
public class ApplianceItem {

    private ApplianceType tipo;
    private int quantidade;

    public ApplianceItem() {}

    public ApplianceItem(ApplianceType tipo, int quantidade) {
        this.tipo = tipo;
        this.quantidade = quantidade;
    }

    public ApplianceType getTipo() { return tipo; }
    public void setTipo(ApplianceType tipo) { this.tipo = tipo; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    /** Consumo diário estimado em kWh (watts * horas * quantidade / 1000) */
    public double getConsumoDiarioKwh() {
        return (tipo.getPotenciaWatts() * tipo.getHorasUsoDia() * quantidade) / 1000.0;
    }

    /** Consumo mensal estimado em kWh */
    public double getConsumoMensalKwh() {
        return getConsumoDiarioKwh() * 30;
    }

    /** Potência total em watts (potência * quantidade) */
    public double getPotenciaTotalWatts() {
        return tipo.getPotenciaWatts() * quantidade;
    }
}

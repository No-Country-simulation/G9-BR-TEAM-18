package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public class AnaliseRequestDTO {

    /** DTO para um item de aparelho específico */
    public static class ApplianceItemDTO {
        private String tipo;      // identificador do enum ApplianceType (ex: "GELADEIRA")
        private int quantidade;

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public int getQuantidade() { return quantidade; }
        public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    }

    // --- Campos MANUAIS (fallback quando aparelhos não for informado) ---
    @Positive
    private Double consumoKwh;

    @NotNull
    private Boolean usoHorarioPico;

    @Positive
    private Integer quantidadeEquipamentos;

    @NotBlank
    private String tipoImovel;

    @NotNull @Positive
    private Double horasAltoConsumo;

    private String categoriaMaiorConsumo = "Outros";
    private Double refrigWatts = 0.0;
    private Double aquecimentoWatts = 0.0;
    private Double climatizacaoWatts = 0.0;
    private Double iluminacaoWatts = 0.0;

    // --- Campos de APARELHOS ESPECÍFICOS (nova abordagem) ---
    private List<ApplianceItemDTO> aparelhos;

    public static class DistribuicaoConsumo {
        @com.fasterxml.jackson.annotation.JsonProperty("REFRIGERACAO_WATTS")
        private Double refrigWatts = 0.0;

        @com.fasterxml.jackson.annotation.JsonProperty("AQUECIMENTO_WATTS")
        private Double aquecimentoWatts = 0.0;

        @com.fasterxml.jackson.annotation.JsonProperty("CLIMATIZACAO_WATTS")
        private Double climatizacaoWatts = 0.0;

        @com.fasterxml.jackson.annotation.JsonProperty("ILUMINACAO_WATTS")
        private Double iluminacaoWatts = 0.0;

        public Double getRefrigWatts() { return refrigWatts; }
        public void setRefrigWatts(Double refrigWatts) { this.refrigWatts = refrigWatts; }

        public Double getAquecimentoWatts() { return aquecimentoWatts; }
        public void setAquecimentoWatts(Double aquecimentoWatts) { this.aquecimentoWatts = aquecimentoWatts; }

        public Double getClimatizacaoWatts() { return climatizacaoWatts; }
        public void setClimatizacaoWatts(Double climatizacaoWatts) { this.climatizacaoWatts = climatizacaoWatts; }

        public Double getIluminacaoWatts() { return iluminacaoWatts; }
        public void setIluminacaoWatts(Double iluminacaoWatts) { this.iluminacaoWatts = iluminacaoWatts; }
    }

    private DistribuicaoConsumo distribuicaoConsumoDiario;

    // --- Getters/Setters ---
    public Double getConsumoKwh() { return consumoKwh; }
    public void setConsumoKwh(Double consumoKwh) { this.consumoKwh = consumoKwh; }

    public Boolean getUsoHorarioPico() { return usoHorarioPico; }
    public void setUsoHorarioPico(Boolean usoHorarioPico) { this.usoHorarioPico = usoHorarioPico; }

    public Integer getQuantidadeEquipamentos() { return quantidadeEquipamentos; }
    public void setQuantidadeEquipamentos(Integer quantidadeEquipamentos) { this.quantidadeEquipamentos = quantidadeEquipamentos; }

    public String getTipoImovel() { return tipoImovel; }
    public void setTipoImovel(String tipoImovel) { this.tipoImovel = tipoImovel; }

    public Double getHorasAltoConsumo() { return horasAltoConsumo; }
    public void setHorasAltoConsumo(Double horasAltoConsumo) { this.horasAltoConsumo = horasAltoConsumo; }

    public String getCategoriaMaiorConsumo() { return categoriaMaiorConsumo; }
    public void setCategoriaMaiorConsumo(String categoriaMaiorConsumo) { this.categoriaMaiorConsumo = categoriaMaiorConsumo; }

    public Double getRefrigWatts() { return refrigWatts; }
    public void setRefrigWatts(Double refrigWatts) { this.refrigWatts = refrigWatts; }

    public Double getAquecimentoWatts() { return aquecimentoWatts; }
    public void setAquecimentoWatts(Double aquecimentoWatts) { this.aquecimentoWatts = aquecimentoWatts; }

    public Double getClimatizacaoWatts() { return climatizacaoWatts; }
    public void setClimatizacaoWatts(Double climatizacaoWatts) { this.climatizacaoWatts = climatizacaoWatts; }

    public Double getIluminacaoWatts() { return iluminacaoWatts; }
    public void setIluminacaoWatts(Double iluminacaoWatts) { this.iluminacaoWatts = iluminacaoWatts; }

    public DistribuicaoConsumo getDistribuicaoConsumoDiario() { return distribuicaoConsumoDiario; }
    public void setDistribuicaoConsumoDiario(DistribuicaoConsumo distribuicaoConsumoDiario) { this.distribuicaoConsumoDiario = distribuicaoConsumoDiario; }

    public List<ApplianceItemDTO> getAparelhos() { return aparelhos; }
    public void setAparelhos(List<ApplianceItemDTO> aparelhos) { this.aparelhos = aparelhos; }
}

package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class AnaliseRequestDTO {

    @NotNull @Positive
    private Double consumoKwh;

    @NotNull
    private Boolean usoHorarioPico;

    @NotNull @Positive
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

    // New fields for ML model enhancement
    private DistribuicaoConsumo distribuicaoConsumoDiario;

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
}

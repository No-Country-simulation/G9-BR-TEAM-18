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
}

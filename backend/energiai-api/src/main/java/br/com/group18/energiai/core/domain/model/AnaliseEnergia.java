package br.com.group18.energiai.core.domain.model;

import java.time.LocalDateTime;
import java.util.List;

public class AnaliseEnergia {

    private Long id;
    private Double consumoKwh;
    private Boolean usoHorarioPico;
    private Integer quantidadeEquipamentos;
    private String tipoImovel;
    private Double horasAltoConsumo;
    private String categoria;
    private Double probabilidade;
    private Double custoEstimadoMensal;
    private List<String> recomendacoes;
    private LocalDateTime createdAt;

    public AnaliseEnergia() {}

    public AnaliseEnergia(Double consumoKwh, Boolean usoHorarioPico, Integer quantidadeEquipamentos,
                          String tipoImovel, Double horasAltoConsumo) {
        this.consumoKwh = consumoKwh;
        this.usoHorarioPico = usoHorarioPico;
        this.quantidadeEquipamentos = quantidadeEquipamentos;
        this.tipoImovel = tipoImovel;
        this.horasAltoConsumo = horasAltoConsumo;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Double getProbabilidade() { return probabilidade; }
    public void setProbabilidade(Double probabilidade) { this.probabilidade = probabilidade; }

    public Double getCustoEstimadoMensal() { return custoEstimadoMensal; }
    public void setCustoEstimadoMensal(Double custoEstimadoMensal) { this.custoEstimadoMensal = custoEstimadoMensal; }

    public List<String> getRecomendacoes() { return recomendacoes; }
    public void setRecomendacoes(List<String> recomendacoes) { this.recomendacoes = recomendacoes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

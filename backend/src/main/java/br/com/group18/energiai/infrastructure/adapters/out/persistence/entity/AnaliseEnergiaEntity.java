package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "analise_energia")
public class AnaliseEnergiaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double consumoKwh;

    @Column(nullable = false)
    private Boolean usoHorarioPico;

    @Column(nullable = false)
    private Integer quantidadeEquipamentos;

    @Column(nullable = false, length = 50)
    private String tipoImovel;

    @Column(nullable = false)
    private Double horasAltoConsumo;

    @Column(length = 50)
    private String categoriaMaiorConsumo;

    private Double refrigWatts;
    private Double aquecimentoWatts;
    private Double climatizacaoWatts;
    private Double iluminacaoWatts;

    @Column(nullable = false, length = 20)
    private String categoria;

    @Column(nullable = false)
    private Double probabilidade;

    @Column(nullable = false)
    private Double custoEstimadoMensal;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> recomendacoes;

    @Column(length = 100)
    private String origem;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public AnaliseEnergiaEntity() {}

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

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Double getProbabilidade() { return probabilidade; }
    public void setProbabilidade(Double probabilidade) { this.probabilidade = probabilidade; }

    public Double getCustoEstimadoMensal() { return custoEstimadoMensal; }
    public void setCustoEstimadoMensal(Double custoEstimadoMensal) { this.custoEstimadoMensal = custoEstimadoMensal; }

    public List<String> getRecomendacoes() { return recomendacoes; }
    public void setRecomendacoes(List<String> recomendacoes) { this.recomendacoes = recomendacoes; }

    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

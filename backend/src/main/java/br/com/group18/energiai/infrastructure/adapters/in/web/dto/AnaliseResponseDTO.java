package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AnaliseResponseDTO {

    private Long id;
    private String categoria;
    private Double probabilidade;
    private List<String> recomendacoes;
    private Double custoEstimadoMensal;
    private String origem;
    private LocalDateTime createdAt;
    private String categoriaMaiorConsumo;
    private Double refrigWatts;
    private Double aquecimentoWatts;
    private Double climatizacaoWatts;
    private Double iluminacaoWatts;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Double getProbabilidade() { return probabilidade; }
    public void setProbabilidade(Double probabilidade) { this.probabilidade = probabilidade; }

    public List<String> getRecomendacoes() { return recomendacoes; }
    public void setRecomendacoes(List<String> recomendacoes) { this.recomendacoes = recomendacoes; }

    public Double getCustoEstimadoMensal() { return custoEstimadoMensal; }
    public void setCustoEstimadoMensal(Double custoEstimadoMensal) { this.custoEstimadoMensal = custoEstimadoMensal; }

    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

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
}

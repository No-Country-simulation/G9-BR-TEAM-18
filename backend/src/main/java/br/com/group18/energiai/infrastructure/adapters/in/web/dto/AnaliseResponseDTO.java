package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AnaliseResponseDTO {

    private Long id;
    private String categoria;
    private Double probabilidade;
    private List<String> recomendacoes;
    private Double custoEstimadoMensal;
    private LocalDateTime createdAt;

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

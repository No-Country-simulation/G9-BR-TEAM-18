# ADR-0003: Estrategia de fallback para analise energetica

## Status

Aceito

## Contexto

O sistema de análise energética precisa classificar o perfil de consumo de um imóvel e gerar recomendações personalizadas. A equipe identificou três fontes possíveis para essa classificação, cada uma com limitações:

1. **Modelo de Machine Learning (scikit-learn):** Fornece classificação com probabilidade associada, mas pode estar indisponível (serviço fora do ar) ou ter baixa confiança (< 80%)
2. **LLM externo (Groq):** Gera recomendações contextualizadas e naturais, mas tem limites de taxa (30 RPM / 1000 RPD no plano gratuito) e requer chave de API configurada
3. **Regras de negócio (rule-based):** Sempre disponível por ser código local, mas produz recomendações genéricas e fixas

O sistema precisava de uma estratégia que maximizasse a qualidade da resposta sem comprometer a disponibilidade.

## Decisão

A equipe decidiu implementar uma **cadeia de fallback gradual** que segue a ordem: ML Service > Groq (LLM) > Rule-based. A lógica está distribuída entre backend (Java) e ML Service (Python):

**No ML Service (Python):**

1. Tenta classificar com o modelo `categorization-model.joblib` (RandomForest)
2. Se a confiança (probabilidade máxima) for >= 80%, retorna a classificação do modelo + recomendações rule-based
3. Se a confiança for < 80% e o Groq estiver configurado e dentro dos limites de taxa, aciona o Groq para gerar recomendações personalizadas
4. Se o Groq falhar ou exceder os limites, usa recomendações rule-based
5. Se o modelo não estiver carregado, usa classificação rule-based direto

**No backend (Java):**

1. Chama o ML Service via HTTP (`/predict`) com timeout de 5 segundos
2. Se o ML Service responder, retorna o resultado diretamente
3. Se o ML Service estiver indisponível (timeout ou erro), executa a classificação rule-based localmente no `EnergyAnalysisService`
4. Todos os resultados são persistidos com a origem identificada (`model`, `model+groq`, `rule-based`)

O sistema também registra todas as predições em um arquivo JSONL (`treino_feedback.jsonl`) para retreino futuro do modelo.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Apenas modelo ML | Simples; baixa latência | Indisponibilidade total se o serviço cair; recomendações genéricas |
| Apenas Groq | Recomendações ricas e naturais | Dependente de API externa; limites de taxa; custo |
| Apenas regras de negócio | Zero dependência externa; sempre disponível | Recomendações genéricas e repetitivas |
| Fallback ML > Groq > Regras | Máxima qualidade com máxima disponibilidade; cada nível cobre as limitações do anterior | Complexidade de implementação; três caminhos de execução para testar |

## Consequências

- **Positivo:** Sistema nunca fica indisponível para o usuário final, mesmo com serviços externos falhando
- **Positivo:** Qualidade da resposta é proporcional à disponibilidade dos serviços (melhor quando tudo funciona)
- **Positivo:** Logs de baixa confiança permitem retreino contínuo do modelo
- **Negativo:** Três implementações de recomendação para manter e testar
- **Negativo:** Limite de taxa do Groq (1000 chamadas/dia) requer monitoramento para evitar bloqueio
- **Neutro:** A origem da classificação é exposta na resposta (`source`), permitindo depuração e métrica de qualidade

> **Nota:** Consulte o [contrato de API](../contrato-api.md) para os formatos de requisição e resposta, e o [guia de execução](../guia-execucao.md) para configuração da chave Groq.

# ADR-0008: Redesign do Domínio para Gestão de Propriedades e Catálogo Dinâmico

## Status

Aceito

## Contexto

O projeto operava com um modelo de domínio simplificado: as requisições de análise energética (`EnergyAnalysis`) recebiam diretamente os dados dos aparelhos, que por sua vez eram validados contra um enum fixo e *hardcoded* (`ApplianceType`). Essa abordagem gerou as seguintes limitações:

- **Falta de contexto físico:** Não havia como um usuário gerenciar mais de um imóvel (ex: casa e apartamento) e manter históricos separados para cada um.
- **Engessamento do catálogo:** Adicionar ou atualizar a potência de um aparelho exigia alteração no código-fonte (enum) e *redeploy* da aplicação.
- **Payloads inchados:** O frontend precisava enviar a lista completa de equipamentos e potências em toda nova requisição de análise.
- **Dificuldade de consulta:** As recomendações da análise eram salvas como um grande *blob* JSON numa coluna de texto (`StringListConverter`), impedindo consultas granulares no banco de dados.

## Decisão

A equipe decidiu reestruturar completamente a modelagem do domínio, transitando de um modelo "Usuário → Análise" para **"Usuário → Propriedades → Inventário → Análise"**.

As principais mudanças implementadas foram:

1. **Catálogo Dinâmico de Aparelhos:** Substituição do enum `ApplianceType` pela entidade `Appliance`, persistida na tabela `tb_appliance` e gerenciada por migrações do Flyway.
2. **Nova Entidade `Property`:** Imóveis agora pertencem a um usuário e possuem estado (`active`), nome (`alias`) e tipo. Todas as validações de permissão (`ForbiddenOperationException`) ocorrem checando a posse desta propriedade via `PropertyService`.
3. **Inventário Relacional (`PropertyAppliance`):** Os equipamentos não são mais passados soltos; eles formam o inventário de uma propriedade com suas respectivas quantidades.
4. **Normalização de Recomendações:** O `StringListConverter` foi removido. As recomendações do modelo de ML agora são persistidas em uma tabela própria (`tb_analysis_recommendation`), atrelada ao ID da análise.
5. **Enxugamento do Payload de Análise:** O `AnalysisRequestDTO` agora solicita apenas o `propertyId` e os dados gerais de consumo. O backend busca o inventário automaticamente para realizar a agregação matemática no `ApplianceAggregationService`.

## Consequências

- **Positivo:** O sistema agora é escalável para usuários com múltiplos imóveis e históricos isolados.
- **Positivo:** A API do catálogo (`/appliances`) permite que o frontend construa interfaces dinâmicas sem depender de atualizações do backend.
- **Positivo:** Fim de problemas de lentidão e de *parsing* de JSON no banco graças à normalização das tabelas de recomendações.
- **Neutro:** O fluxo de uso ficou mais estruturado para o cliente da API, que agora deve obrigatoriamente cadastrar a propriedade e o inventário antes de solicitar uma análise.

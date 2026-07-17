# ADR-0002: Internacionalização do código para inglês

## Status

Aceito

## Contexto

O projeto foi inicialmente desenvolvido com nomes de classes, métodos, atributos e comentários em português (ex: `AnaliseEnergia`, `Usuario`, `GerarAnaliseUseCase`, `senha`, `nome`). A equipe identificou os seguintes problemas:

- Dificuldade de integração com ferramentas e bibliotecas que esperam convenções em inglês (ex: Jackson para serialização JSON, OpenAPI para documentação)
- Inconsistência entre o código e os contratos de API, que já estavam em inglês (`consumption_kwh`, `peak_hour_usage`)
- Barreira para contribuidores internacionais e documentação futura
- Conflito com convenções da comunidade Java, que adota inglês para nomes de classes e métodos

## Decisão

A equipe decidiu **internacionalizar todo o código fonte para o inglês**, seguindo as convenções da comunidade Java e mantendo a terminologia do negócio em português apenas nas camadas de apresentação (frontend) e nos dados persistidos.

As regras de migração foram:

1. Classes de domínio: `AnaliseEnergia` > `EnergyAnalysis`, `Usuario` > `User`
2. Portas de entrada: `GerarAnaliseUseCase` > `GenerateAnalysisUseCase`
3. Portas de saída: `AnaliseRepositoryPort` > `AnalysisRepositoryPort`, `UsuarioRepositoryPort` > `UserRepositoryPort`
4. Serviços: `AnaliseEnergiaService` > `EnergyAnalysisService`, `AutenticacaoService` > `AuthenticationService`
5. Entidades JPA: `AnaliseEnergiaEntity` > `EnergyAnalysisEntity`, `UsuarioEntity` > `UserEntity`
6. Repositórios JPA: `AnaliseEnergiaJpaRepository` > `EnergyAnalysisJpaRepository`
7. Mappers: `AnaliseEnergiaMapper` > `EnergyAnalysisMapper`
8. Adaptadores: `AnaliseEnergiaRepositoryAdapter` > `EnergyAnalysisRepositoryAdapter`
9. Controllers: `AnaliseController` > `AnalysisController`
10. DTOs: `AnaliseRequestDTO` > `AnalysisRequestDTO`, `CadastroRequestDTO` > `RegisterRequestDTO`
11. Campos de DTO: `senha` > `password`, `nome` > `name`
12. Campos de resposta de erro: `mensagem` > `message`, `campos` > `fields`

A documentação (arquivos `.md`) permaneceu em português, pois o público-alvo do projeto é falante de português.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| Manter tudo em português | Menor esforço inicial; alinhado com o idioma da equipe | Incompatibilidade com ferramentas; inconsistência com contratos de API |
| Internacionalizar apenas contratos de API (DTOs) | Esforço moderado | Código Java continuaria bilíngue, aumentando a confusão cognitiva |
| Internacionalizar todo o código | Consistência total; alinhamento com comunidade Java; compatibilidade com ferramentas | Grande volume de mudanças (133 arquivos); risco de regressão |

## Consequências

- **Positivo:** Código consistente com as convenções da comunidade Java e ferramentas de serialização
- **Positivo:** Contratos de API e código fonte no mesmo idioma, reduzindo erros de mapeamento
- **Positivo:** Facilidade para contribuidores que não falam português
- **Negativo:** Grande número de arquivos modificados simultaneamente, exigindo revisão cuidadosa para evitar erros de mapeamento
- **Negativo:** Arquivos antigos em português precisaram ser removidos e substituídos, perdendo o histórico de git individual de cada arquivo
- **Neutro:** A documentação continuou em português, criando um cenário bilíngue controlado (código em inglês, docs em português)

> **Nota:** Consulte o [glossário do projeto](../glossario.md) para a correspondência entre termos técnicos.

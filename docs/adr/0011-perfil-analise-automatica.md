# ADR-0011: Perfil de Usuário e Análise Automática

## Status

Aceito

## Contexto

O fluxo original de análise energética exigia que o usuário preenchesse um formulário completo com consumo total, tipo de imóvel e lista de equipamentos (quantidade e potência) a cada requisição. Esse modelo apresentava os seguintes problemas:

- **Repetição de dados:** Usuários que faziam análises regulares precisavam reconfigurar os mesmos aparelhos repetidamente
- **Ausência de contexto persistente:** O tipo de imóvel e a lista de equipamentos do usuário não ficavam salvos entre sessões
- **Catálogo limitado:** O backend possuía apenas 5 aparelhos seed na tabela `tb_appliance`, enquanto o catálogo real de equipamentos domésticos tem dezenas de itens (geladeira, micro-ondas, chuveiro, etc.)
- **Dashboard genérico:** A página inicial exibia apenas métricas agregadas sem mostrar a última análise do usuário ou tendências
- **Sem onboarding:** Usuários novos não tinham um ponto de partida claro para configurar seu perfil e solicitar a primeira análise

## Decisão

A equipe decidiu implementar uma **camada de perfil de usuário no frontend** que persiste os dados de propriedade e inventário no backend, combinada com um **catálogo unificado de aparelhos** e **análise automática com um clique**.

### Perfil de Usuário (`/profile`)

Criou-se a página `ProfilePage.tsx` que:

1. Carrega o perfil existente (propriedade + aparelhos) ou inicia vazio
2. Permite selecionar o tipo de imóvel (casa/apartamento/comércio)
3. Apresenta um catálogo visual de 50+ aparelhos com ícones, organizados por categoria
4. Para cada aparelho, permite definir quantidade e regularidade de uso (diário/semanal/mensal)
5. **Salvar (CRUD Backend):** Persiste tipo de imóvel (`PUT /properties/{id}`), adiciona/remove aparelhos (`POST /properties/{id}/appliances`, `DELETE /properties/{id}/appliances/{applianceId}`), atualiza quantidades (`PATCH /properties/{id}/appliances/{applianceId}`)
6. **Salvar local (regularidade):** Regularidade salva em `localStorage` até o backend prover endpoint dedicado
7. **Analisar Agora:** Dispara análise energética com os dados do perfil e navega para o resultado
8. Exibe a última análise realizada com link para detalhes

### Análise Automática (`/analysis`)

A página `AnalysisPage.tsx` foi reescrita para:

1. Carregar o perfil salvo do usuário automaticamente
2. Exibir resumo da propriedade (tipo, endereço) e lista de aparelhos configurados
3. Botão "Analisar Agora" que envia o `propertyId` + consumo calculado ao backend
4. Exibir resultado da última análise se disponível
5. Link para `/profile` para editar o perfil

### Catálogo Unificado de Aparelhos

Criou-se `src/data/appliances.ts` com:

- `APPLIANCE_FALLBACK`: catálogo de 50+ aparelhos com nome, potência média (Watts), ícone e categoria
- `mergeAppliancesWithBackend()`: função que mescla o fallback local com os registros do backend (usando `nome` como chave), garantindo que cada aparelho tenha um `backendId` quando disponível
- O catálogo é compartilhado entre `AnalysisForm.tsx` (análise avulsa) e `ProfilePage.tsx` (perfil)

### Dashboard Aprimorado

`Dashboard.tsx` foi expandido com:

- Card de última análise com badge de classificação (Eficiente/Moderado/Gasto Alto) e indicador de tendência (subiu/caiu/estável)
- Botão "Meu Perfil" para gerenciar dados cadastrados
- Botão "Nova Análise" para análise rápida
- Estado vazio com "Criar Perfil" para usuários sem cadastro

### API Expandida

`api.ts` recebeu as funções:

- `updateProperty(id, data)` - `PUT /api/properties/{id}`
- `listPropertyAppliances(propertyId)` - `GET /api/properties/{propertyId}/appliances`
- `addApplianceToProperty(propertyId, applianceId, quantity)` - `POST /api/properties/{propertyId}/appliances`
- `updateApplianceQuantity(propertyId, applianceId, quantity)` - `PATCH /api/properties/{propertyId}/appliances/{applianceId}`
- `removeApplianceFromProperty(propertyId, applianceId)` - `DELETE /api/properties/{propertyId}/appliances/{applianceId}`

### Tipos

`types/index.ts` foi estendido com:

- `PropertyAppliance`: interface para aparelho vinculado a uma propriedade
- `Regularity`: tipo `'daily' | 'weekly' | 'monthly'`
- `REGULARITY_OPTIONS`: constantes de rotulagem
- `backendId` opcional em `ApplianceType`

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Perfil persistido + análise automática + catálogo unificado** | Dados persistem entre sessões; UX fluida com 1 clique; catálogo rico imediatamente | Regularidade depende de localStorage; catálogo completo do backend exige migration futura |
| **Formulário avulso (modelo original)** | Sem necessidade de cadastro prévio; sem estado compartilhado | Repetitivo para uso frequente; sem histórico de perfil; catálogo limitado aos 5 itens seed |
| **Perfil completo com tabela de preferências no backend** | Regularidade centralizada; sem duplicação de lógica | Requer novas tabelas, endpoints, migrações e DTOs - maior esforço e tempo |
| **Catálogo apenas no backend (50+ seeds via migration)** | Única fonte de verdade; sem merge no frontend | Migration de 50+ inserts seria trabalhosa; backend precisaria de ícones (não é sua responsabilidade) |

## Consequências

- **Positivo:** Dados do usuário (propriedade + aparelhos) persistem entre sessões via CRUD do backend
- **Positivo:** UX simplificada - usuário configura uma vez e analisa com um clique
- **Positivo:** Catálogo de 50+ aparelhos com ícones disponível desde o primeiro uso, mesmo que o backend tenha apenas 5 seeds
- **Positivo:** Dashboard agora é útil como ponto de partida (última análise, tendência, ações rápidas)
- **Positivo:** Catálogo unificado evita duplicação entre `AnalysisForm` e `ProfilePage`
- **Negativo:** Regularidade de uso fica em `localStorage` (não sincronizada entre dispositivos) até o backend prover endpoint dedicado
- **Negativo:** Merge de catálogo (fallback + backend) adiciona complexidade - dois arrays precisam ser reconciliados por nome
- **Negativo:** Estados vazios (sem perfil, sem análise) exigem tratamento extra no frontend
- **Negativo:** Os 50+ aparelhos do fallback não estão no backend - o merge funciona apenas para os 5 seeds existentes; migration futura deve popular `tb_appliance` com o catálogo completo
- **Neutro:** O backend já expunha os endpoints CRUD necessários (`PropertyController`, `PropertyApplianceController`) - o frontend apenas os consumiu

# ADR-0041: Exclusão de análise no Histórico

## Status

Aceito

## Contexto

O frontend exibia o histórico de análises energéticas do usuário, mas não oferecia
nenhuma forma de remover análises antigas, incorretas ou duplicadas. O usuário
precisava de uma opção para excluir análises individualmente com confirmação,
evitando exclusões acidentais.

O backend não possuía endpoint de exclusão para análises, nem o repositório
implementava a operação de `deleteById`.

## Decisão

Adicionar a funcionalidade de exclusão de análise em três camadas:

### Backend - Porta de saída (`AnalysisRepositoryPort`)

Adicionado o método `void deleteById(Long id)` na interface do port.

### Backend - Adaptador de persistência (`EnergyAnalysisRepositoryAdapter`)

Implementado `deleteById()` com `@Transactional` que executa a exclusão em
ordem para respeitar as constraints de chave estrangeira do Oracle:

1. Exclui recomendações associadas (`recommendationRepository.deleteByAnalysisId`)
2. Exclui snapshots de equipamentos (`snapshotRepository.deleteByAnalysisId`)
3. Exclui a análise principal (`analysisRepository.deleteById`)

### Backend - Controller (`AnalysisController`)

Adicionado endpoint `DELETE /analyses/{analysisId}` com:

- Verificação de autenticação via `AuthController.getUserId`
- Verificação de propriedade via `propertyService.getOwned`
- Resposta `204 No Content` em caso de sucesso
- Resposta `404` se a análise não existir
- Resposta `401` se não autenticado

### Frontend - Serviço de API (`api.ts`)

Adicionada função `deleteAnalysis(analysisId: string)` que chama o endpoint
`DELETE /analyses/{analysisId}` com credentials `include`.

### Frontend - Página de Histórico (`History.tsx`)

Adicionado:

- Botão de `Trash2` em cada item do histórico (com `stopPropagation` para
  não abrir o modal de detalhes ao clicar em excluir)
- Modal de confirmação com ícone `AlertTriangle`, mensagem explicativa e
  dois botões: "Cancelar" e "Sim, excluir"
- Estado `deleteError` para exibir mensagem se a exclusão falhar
- Remoção otimista do estado local após exclusão bem-sucedida
- Fechamento automático do modal de detalhes se a análise excluída
  estiver sendo visualizada

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Exclusão com confirmação (escolhida)** | Segurança contra exclusão acidental, feedback visual claro | Um clique extra para confirmar |
| **Exclusão direta sem confirmação** | Mais rápido | Risco de exclusão acidental sem recuperação |
| **Exclusão lógica (soft delete)** | Permite recuperação | Complexidade adicional, dados órfãos no banco |

## Consequências

- Usuário pode manter o histórico limpo, removendo análises desnecessárias
- Backend agora oferece operação completa de CRUD para análises
- A exclusão física (não lógica) é adequada para o estágio atual do projeto,
  já que não há requisito de recuperação de dados
- Commit `28911de`

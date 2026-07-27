# ADR-0036: Alinhamento do Status da Análise entre DB, Backend e Frontend

## Status

Aceito

## Contexto

Durante uma auditoria de consistência entre as CHECK constraints do banco de dados e os enums/constantes do backend e frontend, foi identificada uma discrepância no campo `status` da tabela `tb_energy_analysis`:

| Camada | Valores permitidos |
|---|---|
| **DB (V1)** | `PENDENTE, PROCESSADO, FALHA, FINALIZADO` |
| **Backend (EnergyAnalysisService)** | Define `"PENDENTE"` (default) e `"FINALIZADO"` (após sucesso) |
| **DTO (AnalysisResponseDTO)** | `allowableValues = {"PENDENTE", "CONCLUIDA", "FALHA"}` |
| **Frontend (types/index.ts)** | `type AnalysisStatus = "PENDENTE" \| "CONCLUIDA" \| "FALHA"` |

O backend salvava o status como `"FINALIZADO"`, mas o frontend esperava `"CONCLUIDA"`. Embora um fallback gráfico (F039) evitasse crash na tela, o contrato estava inconsistente e impedia o frontend de exibir corretamente o badge de status para análises concluídas com sucesso.

## Decisão

Alinhar todas as camadas para usar exclusivamente os três valores: `PENDENTE`, `CONCLUIDA`, `FALHA`.

As ações são:

1. **V14 migration**: alterar a CHECK constraint `chk_analysis_status` para:
   ```sql
   CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'FALHA'))
   ```

2. **EnergyAnalysisService.java**: substituir `analysis.setStatus("FINALIZADO")` por `analysis.setStatus("CONCLUIDA")`.

3. **Frontend e DTO**: já estão corretos com `CONCLUIDA` — nenhuma alteração necessária.

### Justificativa

- `CONCLUIDA` é semanticamente mais clara que `FINALIZADO` para o usuário final.
- O frontend já tratava `CONCLUIDA` corretamente.
- O valor `PROCESSADO` e `FINALIZADO` do contrato antigo não são utilizados por nenhuma camada.
- A alteração é segura pois o banco foi resetado recentemente (V12 corrigida, deploy funcional), então não há dados legados com status `FINALIZADO` ou `PROCESSADO`.

## Consequências

- A CHECK constraint passa a refletir exatamente os estados possíveis do fluxo: pendente, concluída ou falha.
- O frontend consegue exibir o badge de status corretamente para análises concluídas.
- Elimina a necessidade do fallback genérico para status desconhecidos nesse campo específico.
- Nenhuma alteração no ML Service é necessária, pois o status é um campo interno do backend.

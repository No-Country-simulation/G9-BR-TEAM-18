# ADR-0033: Remoção do localStorage e Migração de Preferências para o Backend

## Status

Aceito

## Contexto

O frontend utilizava `localStorage` para armazenar dados localmente no navegador do usuário. Isso impedia que as preferências e configurações fossem transferíveis entre dispositivos: um usuário que configurasse sua meta de consumo ou regularidade em um computador não via essas configurações ao fazer login em outro dispositivo.

Os seguintes dados estavam sendo armazenados em `localStorage`:

| Chave | Local | Problema |
|---|---|---|
| `energiai_user` | AuthContext | Cache do usuário logado, só funcionava no mesmo navegador |
| `energiai-theme` | ThemeContext | Preferência de tema, perdida ao trocar de dispositivo |
| `energiai_goal_kwh` | Dashboard | Meta de consumo mensal, não sincronizada entre dispositivos |
| `energiai_regularity` | ProfilePage | Regularidade da análise, não sincronizada entre dispositivos |

O backend já possuía o endpoint `GET /auth/me` que retornava dados do usuário, mas não incluía as preferências. Não havia um endpoint para salvar preferências do usuário.

## Decisão

Migrar todo o armazenamento local para o backend, utilizando o banco de dados Oracle como fonte única da verdade para preferências do usuário:

1. **Adicionar colunas `consumption_goal` e `regularity`** na tabela `tb_user` via Migration V11.
2. **Adicionar endpoint `PUT /auth/preferences`** para salvar preferências do usuário autenticado.
3. **Incluir `consumptionGoal` e `regularity`** na resposta do `GET /auth/me` (através do `LoginResponseDTO`).
4. **Substituir `localStorage`** por chamadas de API nos componentes:
   - `AuthContext`: remover cache, usar apenas `/auth/me`
   - `Dashboard`: carregar e salvar meta via `/auth/me` e `PUT /auth/preferences`
   - `ProfilePage`: carregar e salvar regularidade via `fetchPreferences()` e `PUT /auth/preferences`
5. **Tema (`energiai-theme`)**: migrar de `localStorage` para cookie HTTP, que persiste entre abas e sessões no mesmo navegador. Para sincronização entre dispositivos, seria necessário um endpoint no backend (futuro).

## Modelo de dados

```sql
-- Migration V11
ALTER TABLE tb_user ADD consumption_goal NUMBER(10, 2);
ALTER TABLE tb_user ADD regularity VARCHAR2(20);
```

## Endpoint

`PUT /auth/preferences` - aceita um JSON com campos opcionais:

```json
{
  "consumption_goal": 250.00,
  "regularity": "mensal"
}
```

Retorna o `LoginResponseDTO` atualizado.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Manter localStorage (atual)** | Simples, sem alterações no backend | Dados presos ao dispositivo, não sincronizam |
| **Migrar para backend (escolhida)** | Dados sincronizados entre dispositivos, única fonte da verdade | Requer migration e novo endpoint |
| **Usar cookies para tudo** | Simples, sem backend | Cookies também são por dispositivo, sem sincronização real |

## Consequências

- Preferências do usuário são transferíveis entre dispositivos após login.
- Redução de ~60 linhas de código de gerenciamento de estado local.
- Aumento de ~120 linhas no backend (domínio + entidade + mapper + controller + service + migration).
- 4 testes (AuthContext, PrivateRoute) precisaram ser atualizados para mockar `/auth/me` em vez de `localStorage`.
- Tema continua em cookie (não 100% sincronizado entre dispositivos), mas é o de menor impacto.

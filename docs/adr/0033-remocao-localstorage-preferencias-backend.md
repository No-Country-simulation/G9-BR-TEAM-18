# ADR-0033: Remocao do localStorage e Migracao de Preferencias para o Backend

## Status

Aceito

## Contexto

O frontend utilizava `localStorage` para armazenar dados localmente no navegador do usuario. Isso impedia que as preferencias e configuracoes fossem transferiveis entre dispositivos: um usuario que configurasse sua meta de consumo ou regularidade em um computador nao via essas configuracoes ao fazer login em outro dispositivo.

Os seguintes dados estavam sendo armazenados em `localStorage`:

| Chave | Local | Problema |
|---|---|---|
| `energiai_user` | AuthContext | Cache do usuario logado, so funcionava no mesmo navegador |
| `energiai-theme` | ThemeContext | Preferencia de tema, perdida ao trocar de dispositivo |
| `energiai_goal_kwh` | Dashboard | Meta de consumo mensal, nao sincronizada entre dispositivos |
| `energiai_regularity` | ProfilePage | Regularidade da analise, nao sincronizada entre dispositivos |

O backend ja possuia o endpoint `GET /auth/me` que retornava dados do usuario, mas nao incluia as preferencias. Nao havia um endpoint para salvar preferencias do usuario.

## Decisao

Migrar todo o armazenamento local para o backend, utilizando o banco de dados Oracle como fonte unica da verdade para preferencias do usuario:

1. **Adicionar colunas `consumption_goal` e `regularity`** na tabela `tb_user` via Migration V11.
2. **Adicionar endpoint `PUT /auth/preferences`** para salvar preferencias do usuario autenticado.
3. **Incluir `consumptionGoal` e `regularity`** na resposta do `GET /auth/me` (atraves do `LoginResponseDTO`).
4. **Substituir `localStorage`** por chamadas de API nos componentes:
   - `AuthContext`: remover cache, usar apenas `/auth/me`
   - `Dashboard`: carregar e salvar meta via `/auth/me` e `PUT /auth/preferences`
   - `ProfilePage`: carregar e salvar regularidade via `fetchPreferences()` e `PUT /auth/preferences`
5. **Tema (`energiai-theme`)**: migrar de `localStorage` para cookie HTTP, que persiste entre abas e sessoes no mesmo navegador. Para sincronizacao entre dispositivos, seria necessario um endpoint no backend (futuro).

## Modelo de dados

```sql
-- Migration V11
ALTER TABLE tb_user ADD consumption_goal NUMBER(10, 2);
ALTER TABLE tb_user ADD regularity VARCHAR2(20);
```

## Endpoint

`PUT /auth/preferences` — aceita um JSON com campos opcionais:

```json
{
  "consumption_goal": 250.00,
  "regularity": "mensal"
}
```

Retorna o `LoginResponseDTO` atualizado.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Manter localStorage (atual)** | Simples, sem alteracoes no backend | Dados presos ao dispositivo, nao sincronizam |
| **Migrar para backend (escolhida)** | Dados sincronizados entre dispositivos, unica fonte da verdade | Requer migration e novo endpoint |
| **Usar cookies para tudo** | Simples, sem backend | Cookies tambem sao por dispositivo, sem sincronizacao real |

## Consequencias

- Preferencias do usuario sao transferiveis entre dispositivos apos login.
- Reducao de ~60 linhas de codigo de gerenciamento de estado local.
- Aumento de ~120 linhas no backend (domain + entidade + mapper + controller + service + migration).
- 4 testes (AuthContext, PrivateRoute) precisaram ser atualizados para mockar `/auth/me` em vez de `localStorage`.
- Tema continua em cookie (nao 100% sincronizado entre dispositivos), mas e o de menor impacto.

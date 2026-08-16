# EnergiAI - Frontend

Interface web do EnergiAI, construída com **React 19 + Vite 8 + TypeScript**, React Router, Recharts e
Lucide. Inclui landing page, autenticação (local e Google SSO), dashboard, histórico de análises e o
perfil do imóvel com catálogo de aparelhos.

## Pré-requisitos

- Node.js 24 LTS ou superior
- npm (incluído)

## Variáveis de ambiente

| Variável                | Padrão                  | Descrição                                                                                                       |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | `http://localhost:8080` | URL base da API backend                                                                                         |
| `VITE_GOOGLE_CLIENT_ID` | -                       | Client ID do Google Identity Services (botão "Entrar com Google"); mesmo valor do `GOOGLE_CLIENT_ID` do backend |

## Executar

```bash
# Via script da raiz
./run.sh frontend

# Ou diretamente
cd frontend
npm install
npm run dev
```

Acessar em <http://localhost:5173>.

## Produção

O frontend em produção está publicado em **<https://energiaia.duckdns.org>**,
servido pelo Nginx da VM do backend (Oracle Cloud), consumindo a API
<https://apienergiaia.duckdns.org>. O build usa `VITE_API_URL` apontando para o
subdomínio da API (ver [ADR-0058](../docs/adr/0058-frontend-hospedado-nginx-vm.md)).

## Testes

```bash
cd frontend

# Testes unitários (Vitest + Testing Library)
npm test

# Testes E2E (Playwright) - requer browsers instalados
npm run test:e2e
```

Para os testes E2E em ambiente isolado, use a imagem `energiaia-e2e` (ver
[docs/guia-execucao.md](../docs/guia-execucao.md)).

## Estrutura

- `src/components/` - componentes reutilizáveis
- `src/context/` - contextos de autenticação e tema
- `src/pages/` - páginas (com subpastas por domínio: dashboard, history, profile)
- `src/services/api/` - chamadas HTTP ao backend
- `src/e2e/` - testes end-to-end (Playwright)
- `src/test/` - testes unitários (Vitest)

## Documentação

- [Arquitetura do frontend](../docs/frontend.md)
- [Contrato de API](../docs/contrato-api.md)
- [Design system](../docs/modulos/design-system.md)
- [Guia de teste no Swagger](../docs/teste-openapi.md)

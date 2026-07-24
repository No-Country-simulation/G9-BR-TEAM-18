# ADR-0014: Correcoes de Linting no Frontend - Prettier/ESLint

## Status

Aceito

## Contexto

O CI `lint-frontend` executa duas verificacoes obrigatorias:

1. **ESLint** (regra `react-refresh/export-only-export-components`) - exigia que
   componentes que exportam um hook customizado e seu contexto no mesmo arquivo fossem
   separados. Os arquivos `AuthContext.tsx` e `ThemeContext.tsx` exportavam tanto o
   `Provider` quanto os hooks `useAuth`/`useTheme` e os contextos, violando a regra.
2. **Prettier** (`prettier --check`) - diversos arquivos do frontend estavam com
   formatacao divergente do padrao configurado (aspas duplas, trailingComma all,
   printWidth 100).

Adicionalmente, o componente `Logo.tsx` continha a funcao `logoFaviconSvg` que nao era
utilizada em nenhum lugar do codigo, gerando warning de codigo morto.

## Decisao

A equipe aplicou tres correcoes:

### 1. Separacao de contextos e hooks (ESLint react-refresh)

Os arquivos originais foram divididos em quatro arquivos cada:

- `authContext.ts` - exporta apenas `AuthContext` (objeto contexto)
- `useAuth.ts` - exporta apenas o hook `useAuth` customizado
- `AuthContext.tsx` - exporta apenas o componente `AuthProvider`
- (mesmo padrao para `ThemeContext`/`themeContext`/`useTheme`)

Isso satisfaz a regra `react-refresh/export-only-export-components` pois cada arquivo
exporta um unico componente/hook.

### 2. Formatacao com Prettier

```bash
npx prettier --write .
```

Aplicado em todos os arquivos do frontend para alinhar com a configuracao do projeto.

### 3. Remocao de codigo morto

A funcao `logoFaviconSvg` foi removida de `Logo.tsx` por ser nao utilizada.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Separacao em arquivos (escolhido)** | Compativel com react-refresh, organizacao clara | Mais arquivos no projeto |
| **Inline no mesmo arquivo com disable comment** | Sem arquivos extras | ESLint desabilitado para a regra - perde protecao |
| **Manter como estava e ignorar warning** | Zero alteracao | CI falha, PR nao mescla |

## Consequencias

- **Positivo:** ESLint passa com zero warnings
- **Positivo:** Prettier passa com formatacao consistente
- **Positivo:** Codigo morto removido reduz bundle size
- **Negativo:** Seis arquivos adicionados ao projeto (`authContext.ts`, `useAuth.ts`,
  `themeContext.ts`, `useTheme.ts`)
- **Negativo:** Todos os arquivos do frontend tiveram alteracao de formatacao (grande diff
  no git)

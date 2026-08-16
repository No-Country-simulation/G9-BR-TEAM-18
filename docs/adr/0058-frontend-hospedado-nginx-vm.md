# ADR-0058: Frontend hospedado no Nginx da VM do backend

## Status

Aceito

## Contexto

O deploy do frontend passou por duas fases antes de chegar à solução atual:

1. **Render:** o frontend era publicado como build estático no Render
   (`energiai-frontend.onrender.com`), junto com o backend e o ML Service.
2. **Oracle Object Storage:** durante a migração para a OCI, o plano era hospedar o
   frontend em um bucket público com **Static Website Hosting** (index document
   `index.html` + error document para o roteamento SPA).

Ao executar a migração, o static website hosting **não estava disponível na console**
do tenancy: a raiz do bucket respondia 404 e o OCI CLI da versão instalada não expõe
a opção de website config. O bucket público até servia os objetos diretamente
(`/n/<namespace>/b/<bucket>/o/index.html`), mas sem o error document o refresh em
rotas internas (`/dashboard`, `/history`) quebraria, e a URL final ficaria imprópria
para apresentação.

Além disso, o frontend usa `BrowserRouter` e o backend expõe `GET /dashboard` como
API: servir front e API no mesmo domínio criaria conflito entre a rota SPA e o
endpoint.

Forças e restrições:

- **HTTPS obrigatório:** o login usa cookie de sessão com `SameSite=None` + `Secure`
  quando `SESSION_SECURE=true`; um front em HTTPS exige backend em HTTPS (mixed
  content e cookie `Secure`).
- **Roteamento SPA:** refresh em rota interna não pode dar 404.
- **CORS com credenciais:** o backend valida `CORS_ALLOWED_ORIGINS` com
  `allowCredentials=true`; a origem do front precisa estar exata na lista.
- **Custo:** preferir solução sem infraestrutura adicional (sem Load Balancer nem
  API Gateway pagos).

## Decisão

Servir o frontend estático pelo **Nginx da própria VM do backend** (Oracle Linux 9,
`163.176.54.241`), com a API em um **subdomínio do mesmo Nginx**:

- Frontend: `https://energiaia.duckdns.org` (root `/var/www/energiai`, com
  `try_files $uri $uri/ /index.html` para o roteamento SPA).
- API: `https://apienergiaia.duckdns.org` (proxy reverso para
  `http://127.0.0.1:8080`).
- Um único certificado Let's Encrypt cobre os dois domínios (renovação automática
  via certbot).
- Os domínios usam **DuckDNS** (subdomínios gratuitos `energiaia` e `apienergiaia`
  apontando para `163.176.54.241`).
- O backend roda em Docker com `--restart unless-stopped` (sobrevive a reboot).
- O bucket `energiaia-frontend` do Object Storage passa a guardar o `dist/` como
  **artefato/backup**, não como servidor do site.

### Por que subdomínio para a API

A rota SPA `/dashboard` colide com o endpoint `GET /dashboard`. Separar a API em um
subdomínio (`apienergiaia.duckdns.org`) elimina o conflito sem tocar no código: o
Nginx serve o SPA no domínio principal e faz proxy no subdomínio.

### Build-time

A `VITE_API_URL` é embutida no bundle em build time; trocar de domínio exige
rebuild:

```bash
VITE_API_URL=https://apienergiaia.duckdns.org \
VITE_GOOGLE_CLIENT_ID=<client-id> \
npm run build
```

## Detalhes de implementação (armadilhas do Oracle Linux 9)

- **SELinux:** os arquivos copiados para `/var/www/energiai` podem ficar com
  contexto errado (`var_t`) e a pasta `assets/` pode chegar com modo `700` (do
  `scp`) - sintomas: 403 no site e 502 no proxy. Correção:

  ```bash
  sudo chmod -R a+rX /var/www/energiai
  sudo restorecon -Rv /var/www/energiai
  sudo setsebool -P httpd_can_network_connect 1   # proxy nginx -> 8080
  ```

- **Envs do backend** (recriar o container após alterar o `.env`):

  ```ini
  CORS_ALLOWED_ORIGINS=https://energiaia.duckdns.org
  SESSION_SECURE=true
  OPENAPI_SERVER_URL=https://apienergiaia.duckdns.org
  ```

- **Google OAuth:** adicionar `https://energiaia.duckdns.org` nas origens
  JavaScript autorizadas do Client ID.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Nginx na VM do backend + subdomínio (escolhido)** | Zero infra extra; HTTPS já existente; SPA e API sem conflito; custo zero | Front e API na mesma VM de 500 MB de RAM |
| **Object Storage com Static Website Hosting** | Serviço gerenciado; URL própria | Recurso indisponível na console do tenancy (raiz 404) |
| **Object Storage + API Gateway + PAR** | URL própria com API Gateway | Muita infra; VCN/NSG; custo e complexidade |
| **Mesmo domínio com proxy de paths** | Um só domínio | Conflito `/dashboard` (SPA vs API); exigiria mapeamento por `Accept` ou context-path no backend |
| **HashRouter no frontend** | Funciona em bucket puro | URL com `#`; mudança de código e de UX |

## Consequências

- **Positivo:** aplicação completa disponível em HTTPS com nomes legíveis
  (`energiaia.duckdns.org`), SPA com refresh funcionando e login (email/senha e
  Google) de ponta a ponta.
- **Positivo:** nenhuma infraestrutura adicional (sem Load Balancer/API Gateway) e
  certificado com renovação automática.
- **Negativo:** front e API disputam a mesma VM de 500 MB; o backend demora vários
  minutos para iniciar e pode precisar de `-Xmx` reduzido.
- **Negativo:** DuckDNS exige renovação manual (login no site a cada 30 dias) para
  manter os subdomínios ativos.
- **Neutro:** troca de domínio exige rebuild do frontend (`VITE_API_URL` embutida),
  atualização do CORS/`OPENAPI_SERVER_URL` no backend e das origens no Google Cloud
  Console.

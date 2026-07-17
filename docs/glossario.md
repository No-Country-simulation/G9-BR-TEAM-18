# Glossário do projeto

Definição dos termos de domínio utilizados na documentação do EnergiIA. Este dicionário centralizado evita que o mesmo termo apareça com significados diferentes em documentos distintos.

## Termos do domínio de energia

| Termo | Definição |
|---|---|
| Categoria energética | Classificação do perfil de consumo em cinco níveis: Excelente, Bom, Mediano, Ruim e Crítico |
| Consumo em kWh | Quantidade de energia elétrica consumida em quilowatt-hora, utilizada como métrica principal de entrada |
| Custo mensal estimado | Valor calculado multiplicando o consumo em kWh pela tarifa de referência (R$ 0,75/kWh) |
| Horário de pico | Faixa horária de maior demanda no sistema elétrico, tipicamente entre 18h e 21h |
| Horas de alto consumo | Quantidade de horas por dia em que o imóvel concentra o maior uso de equipamentos elétricos |
| Perfil energético | Classificação qualitativa do padrão de consumo do imóvel, obtida por modelo ML, regras ou fallback LLM |
| Quantidade de equipamentos | Número total de aparelhos eletroeletrônicos presentes no imóvel |
| Tarifa de referência | Valor do kWh utilizado como base para estimativa de custo (R$ 0,75) |
| Tipo de imóvel | Categoria do imóvel analisado: Casa, Apartamento ou Comercial |
| Uso em horário de pico | Indicador booleano se o imóvel concentra consumo durante a faixa de pico do sistema elétrico |

## Termos técnicos e de arquitetura

| Termo | Definição |
|---|---|
| ADR | Architecture Decision Record: documento que registra uma decisão arquitetural significativa, seu contexto e consequências |
| Adaptador | Componente da camada de infraestrutura que traduz estímulos externos em chamadas ao núcleo do sistema (padrão Ports and Adapters) |
| Arquitetura Hexagonal | Padrão arquitetural que isola as regras de negócio (domínio) das dependências tecnológicas externas através de portas e adaptadores |
| Domínio | Camada central do sistema que contém as entidades de negócio e regras, sem dependência de frameworks ou infraestrutura |
| DTO | Data Transfer Object: objeto utilizado para transferir dados entre camadas, especialmente na comunicação HTTP |
| Fallback | Mecanismo de degradação gradual que define uma alternativa quando o método principal falha (ML > Groq > regras) |
| Inversão de Dependência | Princípio onde as camadas externas dependem de abstrações definidas pelas camadas internas, e não o contrário |
| Porta | Interface que define um contrato entre o domínio e o mundo externo, podendo ser de entrada (casos de uso) ou saída (infraestrutura) |
| Ports and Adapters | Outro nome para a Arquitetura Hexagonal |

## Termos de infraestrutura e serviços

| Termo | Definição |
|---|---|
| Backend | Serviço Java Spring Boot que implementa as regras de negócio e orquestra as análises (porta 8080) |
| FastAPI | Framework Python utilizado pelo ML Service para expor endpoints de predição |
| Frontend | Interface web React com Vite para interação do usuário (porta 5173) |
| Groq | Provedor de API de LLM utilizado como fallback para geração de recomendações quando a confiança do modelo ML é baixa |
| H2 | Banco de dados relacional em memória utilizado no ambiente de desenvolvimento |
| ML Service | Microsserviço Python responsável pela classificação energética via modelo de machine learning e fallback para LLM |
| scikit-learn | Biblioteca Python de machine learning utilizada para treinar o modelo de classificação energética |
| Spring Boot | Framework Java utilizado no backend para criar a API REST e gerenciar a camada de persistência |
| Swagger UI | Interface web interativa para visualizar e testar os endpoints da API a partir da documentação OpenAPI |
| Vite | Bundler e servidor de desenvolvimento utilizado no frontend React |
| Oracle Cloud (OCI) | Infraestrutura em nuvem da Oracle utilizada para hospedar o banco de dados em produção |

## Regras de negócio referenciadas

| ID | Descrição | Documento de origem |
|---|---|---|
| RF010 | Análise de consumo envia os dados agregados para o ML Service e retorna a categoria energética | [contrato-api.md](./contrato-api.md) |
| RN003 | O fallback deve seguir a ordem: modelo ML, Groq, regras de negócio | [arquitetura-hexagonal.md](./arquitetura-hexagonal.md) |

> **Nota:** Este glossário é o documento fonte para terminologia. Ao introduzir um novo termo em qualquer documentação, verifique se ele já existe aqui. Se não existir, adicione-o antes de publicar o documento.

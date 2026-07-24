# Pontos verificados pela análise de diffs

1. **Merges do fluxo homolog-dev** - O commit 22e18f7 ("Merge branch 'homolog' into dev") tem mensagem genérica, mas seu diff revela apenas mudanças de Dockerfile e docker-compose, já capturadas pelo card I002. Os commits 48f82e8 e 189d05e possuem mensagens descritivas detalhadas.

2. **NOTEBOOK-UPDATES como branch de consulta** - Referência de Data Science. O conteúdo é reescrito no padrão de `dev` antes da integração. Os commits 759a169, 17fff74 e 866b583 são material de consulta, não entregas pendentes.

    Fluxo: `dev` (Render) > `homolog` (OCI) > `main` (produção).

3. **Classificação de escopo, tamanho e prioridade por estimativa** - Estes atributos foram atribuídos com base na análise de contexto, pois não há métrica objetiva no histórico para determiná-los com precisão.

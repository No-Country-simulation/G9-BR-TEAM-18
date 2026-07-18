# Glossário

**PPH (Pesquisa de Posse de Equipamentos e Hábitos de Uso)**
Levantamento real usado como fonte de dados do projeto, contendo posse e consumo de energia por tipo de aparelho em domicílios brasileiros.

**Índice de ineficiência energética**
Métrica composta (0 a 1), calculada internamente, que combina consumo relativo ao tipo de imóvel, uso em horário de pico, quantidade de equipamentos e horas de alto consumo. Serve apenas para gerar o rótulo de treino do classificador — não é recalculado em produção.

**Quintis**
Divisão de uma distribuição em 5 partes de tamanho igual (20% cada). Usado para transformar o índice de ineficiência (um número contínuo) nas 5 categorias finais.

**Categoria de eficiência**
Uma das 5 classes previstas pelo classificador: `Excelente`, `Bom`, `Mediano`, `Ruim`, `Crítico`. Ordenadas da mais para a menos eficiente.

**Categoria de maior consumo**
Uma entre 6 categorias de aparelhos (`Refrigeração`, `Climatização`, `Iluminação`, `Eletrodomésticos`, `Tecnologia`, `Serviços`) ou `Outros`, indicando qual grupo de equipamentos mais consumiu energia no domicílio.

**Vazamento de dados (data leakage)**
Erro de modelagem em que uma feature usada no treinamento contém, direta ou indiretamente, informação sobre o próprio alvo que o modelo deveria prever — infla artificialmente a acurácia sem representar generalização real. No projeto, isso motivou a exclusão de `valor_estimado_conta_reais` (proporcional a `consumo_total_kwh_mes`) das features de treinamento.

**Few-shot (exemplo de estilo)**
Técnica de prompt engineering em que um exemplo do resultado esperado é incluído no prompt, ajudando o modelo de linguagem a seguir o formato e o tom desejado, reduzindo alucinações.

**Temperatura (LLM)**
Parâmetro que controla a aleatoriedade da geração de texto de um LLM. `temperature=0` produz saída determinística (sempre a opção mais provável); valores mais altos aumentam a variação/criatividade, com maior risco de alucinação.

**Alucinação (LLM)**
Quando um modelo de linguagem gera informação incorreta, inventada ou sem relação com os dados fornecidos, apresentando-a como se fosse válida.

**Pipeline (scikit-learn)**
Objeto que encadeia etapas de pré-processamento e modelo em um único artefato treinável e serializável, no projeto, garante que qualquer novo dado passe pelo mesmo scaler/encoder usados no treino antes de chegar ao classificador.

**GGUF**
Formato de arquivo para modelos de linguagem quantizados, otimizado para inferência eficiente em CPU via `llama.cpp`. Usado em uma versão anterior do projeto, antes da migração para a API da Groq.

**LPU (Language Processing Unit)**
Chip de inferência desenvolvido pela Groq, especializado em rodar modelos de linguagem com latência muito baixa.

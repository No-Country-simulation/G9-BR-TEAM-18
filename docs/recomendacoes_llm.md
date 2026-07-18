# Geração de Recomendações (LLM)

## Provedor: Groq

As recomendações textuais são geradas via **API da Groq**, usando o modelo `llama-3.3-70b-versatile`.
Obs: Sujeito a alterações, logo esse modelo pode difererir do utilizado na prática.

### Histórico de decisão

O projeto passou por três abordagens antes de chegar à atual:

1. **Modelo local via `transformers` (GPU)** — `Qwen/Qwen2.5-1.5B-Instruct`, carregado com `AutoModelForCausalLM`. Funcional, mas dependente de GPU disponível.
2. **Modelo local via `llama.cpp` (CPU)** — mesmo Qwen, em formato **GGUF** quantizado (`Q4_K_M`), otimizado para inferência em CPU pura via `llama-cpp-python`. Resolveu a dependência de GPU, mas ainda levava dezenas de segundos a minutos por chamada em CPUs com poucos núcleos.
3. **API da Groq (atual)** — elimina a dependência de hardware local (GPU/CPU) por completo. A Groq roda os modelos em chips próprios (LPU), com latência muito menor, e permite usar um modelo maior e mais capaz (70B) do que seria viável rodar localmente na hackathon.

**Trade-off assumido:** a solução atual depende de internet e de um serviço externo (rate limits do tier gratuito, disponibilidade da API). Importante ter capturas de tela/saídas de exemplo como plano B para demonstrações sem internet garantida.

## Separação de responsabilidades: quem decide o quê

O LLM **nunca decide a categoria de eficiência** — essa decisão vem do classificador Random Forest (ver `modelo_classificacao.md`). O papel do LLM é exclusivamente **traduzir uma decisão já tomada em recomendações de texto natural**. Isso evita dois problemas:
- O modelo "inventar" uma categoria diferente da que o classificador calculou.
- Inconsistência entre o campo `categoria` da resposta da API e o teor das recomendações geradas.

## Engenharia de prompt

O prompt é dividido em: instrução principal, lista de regras obrigatórias, exemplo de estilo (few-shot) e os dados do domicílio.

### Regras obrigatórias (resumo)

- Escopo restrito a hábitos de uso, horários de consumo e manutenção/substituição de equipamentos elétricos — nada de água, gás ou outros recursos.
- Pelo menos uma recomendação deve abordar especificamente a **categoria de maior consumo** e os **aparelhos líderes em consumo** do domicílio (`categoria_maior_consumo`, `produtos_maior_consumo`).
- Proibido inventar equipamentos ou hábitos não informados nos dados.
- Se `tipo_imovel == "Apartamento"`, proibido sugerir painéis solares ou soluções que dependam de telhado/espaço externo próprio.
- Cada recomendação deve abordar um aspecto diferente (sem repetição de tema).
- Proibido citar marcas, modelos ou preços.
- Máximo 20 palavras por recomendação.
- Tom ajustado à categoria: `Excelente`/`Bom` reforça boas práticas; `Mediano` sugere ajustes pontuais; `Ruim`/`Crítico` é mais direto, com mais urgência em `Crítico`.
- Proibido emojis, markdown ou numeração na resposta.

### Por que um exemplo de estilo (few-shot) foi necessário

Nos testes iniciais, sem few-shot e com `temperature` alta, o modelo pequeno (Qwen 1.5B) chegou a gerar recomendações sem relação alguma com eficiência energética (ex: "faça um relógio solar para monitorar consumo", "limpe os raios UV da janela"). Duas mudanças resolveram o problema:
1. Inclusão de um exemplo curto de recomendação válida no prompt (ancora o formato e o tipo de conteúdo esperado).
2. Geração determinística (`temperature=0`), eliminando a variabilidade que levava a essas alucinações.

### Regra dinâmica por atributo do cliente

Uma lição aprendida durante os testes: regras condicionais escritas de forma genérica no prompt (ex: *"não mencione X a menos que seja relevante"*) nem sempre são seguidas pelo modelo. A correção foi tornar a regra **dinâmica**, computada em Python antes de montar o prompt, com base no dado real do cliente — por exemplo, ao usar a variável `ar_condicionado` (em uma versão anterior do dataset), a regra passava a ser explicitamente **"NUNCA mencione X"** quando o cliente não possuía o equipamento, em vez de uma instrução condicional ambígua.

## Assinatura da função

```python
def gerar_recomendacoes(df: dict, categoria: str, max_new_tokens: int = 100) -> list[str]:
    ...
```

- `df`: dicionário com os dados do domicílio (não é o DataFrame completo — é a linha de **um único cliente**, já convertida para dicionário).
- `categoria`: categoria de eficiência já prevista pelo classificador.
- Retorno: lista com exatamente 3 strings (recomendações), sem numeração ou marcadores.

## Pós-processamento

A resposta bruta do modelo passa por uma limpeza antes de virar a lista final:
```python
recomendacoes = [
    re.sub(r"^\s*[\d]+[\.\)]?\s*", "", linha).strip("-•* ").strip()
    for linha in texto.strip().split("\n")
    if linha.strip()
]
```
Isso remove numeração (`1.`, `2)`, etc.) e marcadores (`-`, `•`, `*`) que o modelo eventualmente insere mesmo com a instrução explícita de não fazê-lo — o pós-processamento garante robustez mesmo quando o modelo não obedece 100% da instrução.

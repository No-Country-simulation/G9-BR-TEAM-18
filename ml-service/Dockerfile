# Usa uma imagem mais recente do Python
FROM python:3.12-slim

# Define a pasta de trabalho
WORKDIR /app

# Copia as dependências
COPY requirements.txt .

# Atualiza o instalador de pacotes primeiro
RUN pip install --upgrade pip

# Instala as bibliotecas
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código
COPY . .

# Expõe a porta
EXPOSE 8000

# Inicia o servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

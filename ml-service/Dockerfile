# Imagem oficial e leve do Python
FROM python:3.11-slim

# Pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências (para otimizar o cache do Docker)
COPY requirements.txt .

# Instala as bibliotecas
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código (main.py, features.py, modelo.joblib)
COPY . .

# Expõe a porta que o Render vai ler
EXPOSE 8000

# Comando para iniciar o servidor do FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  cat <<EOF
Uso: ./run.sh <comando>

Comandos:
  backend          Inicia o backend Spring Boot (porta 8080)
  frontend         Inicia o frontend React/Vite (porta 5173)
  ml-service       Inicia o ML Service FastAPI (porta 8000)
  test             Executa todos os testes (frontend + backend)
  test:backend     Executa apenas os testes do backend
  test:frontend    Executa apenas os testes do frontend
  all              Inicia os 3 serviços simultaneamente
  build            Compila backend e frontend sem iniciar
EOF
}

cmd_backend() {
  echo ">>> Iniciando backend (Spring Boot) na porta 8080..."
  cd "$ROOT_DIR/backend"
  if [ ! -f "mvnw" ]; then
    echo "Aviso: mvnw não encontrado. Use 'mvn spring-boot:run' se tiver Maven instalado."
  fi
  ./mvnw spring-boot:run -q
}

cmd_frontend() {
  echo ">>> Iniciando frontend (Vite) na porta 5173..."
  cd "$ROOT_DIR/frontend"
  npm install --silent
  npm run dev
}

cmd_ml_service() {
  echo ">>> Iniciando ML Service (FastAPI) na porta 8000..."
  cd "$ROOT_DIR/ml-service"
  if [ ! -d "venv" ]; then
    echo "Criando virtual environment..."
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install -q -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

cmd_test() {
  cmd_test_backend
  cmd_test_frontend
}

cmd_test_backend() {
  echo ">>> Executando testes do backend..."
  cd "$ROOT_DIR/backend"
  if [ ! -f "mvnw" ]; then
    echo "mvnw não encontrado. Execute com 'mvn test'."
    return 1
  fi
  ./mvnw test -q
}

cmd_test_frontend() {
  echo ">>> Executando testes do frontend..."
  cd "$ROOT_DIR/frontend"
  npm test
}

cmd_build() {
  echo ">>> Compilando backend..."
  cd "$ROOT_DIR/backend"
  ./mvnw package -DskipTests -q

  echo ">>> Compilando frontend..."
  cd "$ROOT_DIR/frontend"
  npm run build
}

case "${1:-}" in
  backend)       cmd_backend ;;
  frontend)      cmd_frontend ;;
  ml-service)    cmd_ml_service ;;
  test)          cmd_test ;;
  test:backend)  cmd_test_backend ;;
  test:frontend) cmd_test_frontend ;;
  build)         cmd_build ;;
  all)
    echo "Serviços serão iniciados em terminais separados."
    echo "Use: ./run.sh backend   (em um terminal)"
    echo "     ./run.sh ml-service (em outro terminal)"
    echo "     ./run.sh frontend   (em outro terminal)"
    ;;
  *)
    usage
    exit 1
    ;;
esac

#!/bin/bash

# Configurações
BASE_URL="http://localhost:3000/api"
AUTH_TOKEN="seu_token_aqui"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Função para fazer requisições
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4

  echo -e "\n${GREEN}Testando $method $endpoint${NC}"
  
  if [ -n "$data" ]; then
    response=$(curl -s -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "$data" \
      -w "\n%{http_code}" \
      $BASE_URL$endpoint)
  else
    response=$(curl -s -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\n%{http_code}" \
      $BASE_URL$endpoint)
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "Status: $status_code"
  echo "Response: $body"

  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Teste passou${NC}"
  else
    echo -e "${RED}✗ Teste falhou - Status esperado: $expected_status${NC}"
  fi
}

# Teste 1: Marcar todas as notificações como lidas
echo -e "\n${GREEN}=== Teste 1: Marcar todas as notificações como lidas ===${NC}"
make_request "POST" "/notifications/read-all" "" 200

# Teste 2: Marcar uma notificação específica como lida
echo -e "\n${GREEN}=== Teste 2: Marcar notificação específica como lida ===${NC}"
make_request "PATCH" "/notifications/1/read" "" 200

# Teste 3: Remover uma notificação
echo -e "\n${GREEN}=== Teste 3: Remover notificação ===${NC}"
make_request "DELETE" "/notifications/1" "" 200

# Teste 4: Tentar acessar sem autenticação
echo -e "\n${GREEN}=== Teste 4: Tentar acessar sem autenticação ===${NC}"
curl -s -X GET \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}" \
  $BASE_URL/notifications

echo -e "\n${GREEN}Testes concluídos!${NC}" 
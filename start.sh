#!/usr/bin/env bash

# ==============================================================================
# 🚢 TERSANE — PARALEL TEK KOMUTLA BAŞLATMA SCRİPTİ (LOCAL DEV RUNNER)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="${NC}
echo -e "${BLUE} 🚢 TERSANE (K8s Shipyard 3D) — Local Dev Launcher"${NC}
echo -e "${BLUE}=================================================="${NC}

# Trap SIGINT / SIGTERM to clean up background processes cleanly
cleanup() {
    echo -e "\n${YELLOW}[info] Durduruluyor... Arka plan servisleri kapatılıyor.${NC}"
    kill 0 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Go Backend Server
echo -e "${GREEN}[1/2] 🚀 Backend sunucusu başlatılıyor (Go client-go)...${NC}"
(cd backend && go run main.go) &
BACKEND_PID=$!

# Give backend 1 second to start port resolution
sleep 1.5

# 2. Check Node dependencies & Start React Vite Frontend
echo -e "${GREEN}[2/2] 🌐 Frontend geliştirme sunucusu başlatılıyor (Vite)...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}[npm] node_modules bulunamadı. npm install çalıştırılıyor...${NC}"
    (cd frontend && npm install)
fi

(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo -e "\n${BLUE}--------------------------------------------------"${NC}
echo -e "${GREEN}✅ TERSANE SİSTEMİ AKTİF!"${NC}
echo -e " 🔹 Backend (Go API & WS):  ${YELLOW}http://localhost:8000${NC}"
echo -e " 🔹 Frontend (React 3D):    ${YELLOW}http://localhost:5173${NC}"
echo -e "${BLUE}--------------------------------------------------"${NC}
echo -e "${YELLOW}Durdurmak için Ctrl+C tuşlarına basın.${NC}\n"

wait

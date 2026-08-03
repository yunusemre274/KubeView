# ==============================================================================
# 🚢 TERSANE (K8s Shipyard 3D) — MAKEFILE
# ==============================================================================

.PHONY: dev build test run-backend run-frontend docker-build clean help

help:
	@echo "Tersane Kullanılabilir Komutlar:"
	@echo "  make dev          - Backend ve Frontend'i paralel başlatır (Lokal Dev)"
	@echo "  make build        - Frontend (Vite build) ve Backend (Go build) üretir"
	@echo "  make docker-build - Production Docker imajını (tersane:latest) derler"
	@echo "  make run-backend  - Sadece Go Backend'i başlatır"
	@echo "  make run-frontend - Sadece React Frontend'i başlatır"
	@echo "  make clean        - Build çıktılarını temizler"

dev:
	./start.sh

run-backend:
	cd backend && go run main.go

run-frontend:
	cd frontend && npm run dev

build:
	@echo "📦 Derleniyor..."
	cd frontend && npm install && npm run build
	cd backend && go build -o ../bin/tersane-backend main.go
	@echo "✅ Build tamamlandı: bin/tersane-backend"

docker-build:
	@echo "🐳 Docker Img Derleniyor..."
	docker build -t tersane:latest .
	@echo "✅ Docker imajı hazır: tersane:latest"

clean:
	rm -rf bin/ frontend/dist backend/backend_binary

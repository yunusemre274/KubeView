.PHONY: dev build test run-backend run-frontend docker-build helm-check clean

dev:
	./start.sh
run-backend:
	cd backend && go run .
run-frontend:
	cd frontend && npm run dev
build:
	cd frontend && npm ci && npm run build
	mkdir -p bin
	cd backend && go build -o ../bin/tersane-backend .
test:
	cd backend && go test ./...
	cd frontend && npm test
helm-check:
	helm lint charts/tersane
	helm template kubeview charts/tersane > /dev/null
docker-build:
	docker build -t kubeview:local .
clean:
	python3 -c "import shutil; [shutil.rmtree(p,ignore_errors=True) for p in ['bin','frontend/dist']]"

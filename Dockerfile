FROM node:24.16.0-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.26.5-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./internal/webui/dist/
ARG VERSION=development
ARG COMMIT=unknown
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-w -s -X main.version=${VERSION} -X main.commit=${COMMIT}" -o /app/kubeview .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -g 10001 -S tersane && adduser -u 10001 -S tersane -G tersane
WORKDIR /app
COPY --from=backend-builder /app/kubeview /app/kubeview
ENV PORT=8000 BIND_ADDR=0.0.0.0 READ_ONLY=true
EXPOSE 8000
USER 10001:10001
ENTRYPOINT ["/app/kubeview"]

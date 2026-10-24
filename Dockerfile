FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-w -s" -o /app/tersane-backend .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -g 10001 -S tersane && adduser -u 10001 -S tersane -G tersane
WORKDIR /app
COPY --from=backend-builder /app/tersane-backend /app/tersane-backend
COPY --from=frontend-builder /app/frontend/dist /app/public
ENV PORT=8000 BIND_ADDR=0.0.0.0 READ_ONLY=true STATIC_DIR=/app/public
EXPOSE 8000
USER 10001:10001
ENTRYPOINT ["/app/tersane-backend"]

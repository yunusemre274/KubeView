# ==========================================
# STAGE 1: Build React 3D Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build Go Backend
# ==========================================
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/tersane-backend .

# ==========================================
# STAGE 3: Production Minimal Runtime
# ==========================================
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend-builder /app/tersane-backend /app/tersane-backend
COPY --from=frontend-builder /app/frontend/dist /app/public

ENV PORT=8000
EXPOSE 8000

# Run as non-root security user
RUN addgroup -S tersane && adduser -S tersane -G tersane
USER tersane

ENTRYPOINT ["/app/tersane-backend"]

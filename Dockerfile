FROM golang:1.22-alpine AS go-base

WORKDIR /src

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

FROM go-base AS test-runner

COPY cmd ./cmd
COPY internal ./internal
COPY web ./web

CMD ["go", "test", "./..."]

FROM go-base AS builder

COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/todo-server ./cmd/server

FROM alpine:3.20 AS runtime

WORKDIR /app

RUN adduser -D -H appuser

COPY --from=builder /out/todo-server /app/todo-server
COPY web /app/web

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV APP_DATA_DIR=/app/data

RUN mkdir -p /app/data && chown -R appuser:appuser /app

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD sh -c 'wget -q -O- "http://127.0.0.1:${APP_PORT:-8080}/healthz" >/dev/null || exit 1'

EXPOSE 8080

USER appuser

CMD ["/app/todo-server"]

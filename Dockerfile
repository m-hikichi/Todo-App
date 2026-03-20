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

ARG TARGETOS
ARG TARGETARCH

COPY cmd ./cmd
COPY internal ./internal

# Build for the Docker target architecture.
RUN set -eu; \
  export CGO_ENABLED=1; \
  if [ -n "${TARGETOS:-}" ]; then export GOOS="${TARGETOS}"; fi; \
  if [ -n "${TARGETARCH:-}" ]; then export GOARCH="${TARGETARCH}"; fi; \
  go build -trimpath -ldflags="-s -w" -o /out/todo-server ./cmd/server

FROM alpine:3.20 AS runtime

WORKDIR /app

RUN apk add --no-cache su-exec \
  && adduser -D -H appuser

COPY --from=builder /out/todo-server /app/todo-server
COPY web /app/web
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV APP_DATA_DIR=/app/data

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R appuser:appuser /app

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD sh -c 'wget -q -O- "http://127.0.0.1:${APP_PORT:-8080}/healthz" >/dev/null || exit 1'

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["/app/todo-server"]

FROM golang:1.22-alpine AS builder

WORKDIR /src

RUN apk add --no-cache gcc musl-dev

COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal
RUN go mod tidy
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/todo-server ./cmd/server

FROM alpine:3.20

WORKDIR /app

RUN adduser -D -H appuser

COPY --from=builder /out/todo-server /app/todo-server
COPY web /app/web

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV APP_DATA_DIR=/app/data

RUN mkdir -p /app/data && chown -R appuser:appuser /app

EXPOSE 8080

USER appuser

CMD ["/app/todo-server"]

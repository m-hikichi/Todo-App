FROM golang:1.22-alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY cmd ./cmd
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/todo-server ./cmd/server

FROM alpine:3.20

WORKDIR /app

RUN adduser -D -H appuser

COPY --from=builder /out/todo-server /app/todo-server
COPY web /app/web

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080

EXPOSE 8080

USER appuser

CMD ["/app/todo-server"]

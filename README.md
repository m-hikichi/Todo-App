# todo_app

Go server + Material Design 3 web UI starter for the Todo app.

## Run (Local)

```bash
go run ./cmd/server
```

Open:

```text
http://127.0.0.1:8080
```

Health check:

```text
http://127.0.0.1:8080/healthz
```

## Run (Docker)

### Option 1: docker compose (recommended)

```bash
docker compose up --build
```

Open:

```text
http://127.0.0.1:8080
```

### Option 2: docker build + run

```bash
docker build -t todo_app:dev .
docker run --rm -p 8080:8080 --name todo_app todo_app:dev
```

Health check:

```text
http://127.0.0.1:8080/healthz
```

## Notes

- UI uses Material Web components (Material Design 3) via CDN.
- Current implementation is a UI-first starter with in-memory Todo state.
- `/healthz` is provided for runtime checks.

# todo_app

Go server + Material Design 3 web UI starter for the Todo app.
Todo は SQLite に保存され、ローカル再起動後も保持されます。

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

SQLite DB は既定で `./data/todo.db` に作成されます。
保存先は `APP_DATA_DIR` または `-data-dir` で変更できます。

## Run (Docker)

### Option 1: docker compose (recommended)

```bash
docker compose up -d --build
```

Open:

```text
http://127.0.0.1:8080
```

`compose.yaml` は `./data` を `/app/data` へマウントするので、コンテナ再作成後も Todo が残ります。
ソース変更後に `docker compose up -d` だけを実行すると、既存イメージが再利用されて新しいコードが反映されないことがあります。
コード変更を反映したい場合は、必ず `docker compose up -d --build` を使ってください。

### Option 2: docker build + run

```bash
docker build -t todo_app:dev .
docker run --rm -p 8080:8080 -e APP_DATA_DIR=/app/data -v "$(pwd)/data:/app/data" --name todo_app todo_app:dev
```

Health check:

```text
http://127.0.0.1:8080/healthz
```

## Notes

- UI uses Material Web components (Material Design 3) via CDN.
- Todo CRUD/state change is backed by `/api/todos` and SQLite persistence.
- `/healthz` is provided for runtime checks.
- Supported runtime config: `APP_HOST`, `APP_PORT`, `APP_DATA_DIR`, and matching CLI flags `-host`, `-port`, `-data-dir`.

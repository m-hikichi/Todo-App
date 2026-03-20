# todo_app

Go server + Material Design 3 web UI starter for the Todo app.
Todo は SQLite に保存され、ローカル再起動後も保持されます。

## Run (Docker)

```bash
docker compose up -d --build
```

Open:

```text
http://127.0.0.1:8080
```

Health check:

```text
http://127.0.0.1:8080/healthz
```

`compose.yaml` は `./data` を `/app/data` へマウントするので、コンテナ再作成後も Todo が残ります。
コンテナ起動時に `APP_DATA_DIR` を自動作成し、初回起動や CI の bind mount でも SQLite を作成できるように権限を補正します。
ホスト側に `go` や `node` は不要です。
ソース変更後に `docker compose up -d` だけを実行すると、既存イメージが再利用されて新しいコードが反映されないことがあります。
コード変更を反映したい場合は、必ず `docker compose up -d --build` を使ってください。

SQLite DB は既定で `./data/todo.db` に作成されます。
保存先は `APP_DATA_DIR` または `-data-dir` で変更できます。

## Test (Docker)

```bash
docker compose --profile test run --no-deps --rm todo-test
```

`todo-test` は Docker 内で `go test ./...` を実行します。
ホスト側の Go ツールチェーンは不要です。

## Build + Run (Direct Docker)

```bash
docker build --target runtime -t todo_app:dev .
docker run --rm -p 8080:8080 -e APP_DATA_DIR=/app/data -v "${PWD}/data:/app/data" --name todo_app todo_app:dev
```

テストだけを Docker で直接実行したい場合:

```bash
docker build --target test-runner -t todo_app:test .
docker run --rm todo_app:test
```

## CI

GitHub Actions は [ci.yml](./.github/workflows/ci.yml) で次を実行します。

1. `docker compose config` で Compose 定義を検証
2. `docker compose --profile test run --no-deps --rm todo-test` で Docker 内テスト
3. `docker compose build todo-app` で本番イメージをビルド
4. `docker compose up -d todo-app` で起動し `/healthz` を確認
5. コンテナが異常終了した場合は、その時点でログを出して fail fast する

CI でもホストに `go` / `node` を前提としません。

## Notes

- UI uses Material Web components (Material Design 3) via CDN.
- Todo CRUD/state change is backed by `/api/todos` and SQLite persistence.
- `/healthz` is provided for runtime checks.
- Supported runtime config: `APP_HOST`, `APP_PORT`, `APP_DATA_DIR`, and matching CLI flags `-host`, `-port`, `-data-dir`.

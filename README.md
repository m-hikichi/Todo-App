# todo_app

Go server + Material Design 3 web UI starter for the Todo app.
Todo は SQLite に保存され、ローカル再起動後も保持されます。

## Run (Docker)

```bash
docker compose up -d --build
```

## OS-Specific Startup

### Windows

前提:

- Docker Desktop をインストールして起動しておく
- リポジトリのルートで PowerShell を開く

Compose で起動:

```powershell
docker compose up -d --build
```

停止:

```powershell
docker compose down
```

Direct Docker Run:

```powershell
docker build --target runtime -t todo_app:dev .
docker run --rm -p 8080:8080 -e APP_DATA_DIR=/app/data -v "$($PWD.Path)\data:/app/data" --name todo_app todo_app:dev
```

### macOS

前提:

- Docker Desktop をインストールして起動しておく
- リポジトリのルートで Terminal を開く

Compose で起動:

```bash
docker compose up -d --build
```

停止:

```bash
docker compose down
```

Direct Docker Run:

```bash
docker build --target runtime -t todo_app:dev .
docker run --rm -p 8080:8080 -e APP_DATA_DIR=/app/data -v "$(pwd)/data:/app/data" --name todo_app todo_app:dev
```

Apple Silicon を含む macOS でも、Docker のターゲットアーキテクチャに合わせて実行イメージをビルドします。

### Ubuntu / Linux

前提:

- Docker Engine と Docker Compose plugin をインストールしておく
- リポジトリのルートでシェルを開く

Compose で起動:

```bash
docker compose up -d --build
```

停止:

```bash
docker compose down
```

Direct Docker Run:

```bash
docker build --target runtime -t todo_app:dev .
docker run --rm -p 8080:8080 -e APP_DATA_DIR=/app/data -v "$(pwd)/data:/app/data" --name todo_app todo_app:dev
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
Docker ビルドはホストの Docker ターゲットアーキテクチャに追従するので、Intel 系だけでなく Apple Silicon や arm64 Linux でも同じ手順で起動できます。
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

上記は macOS / Linux 系シェル向けの例です。Windows では上の `Windows` セクションの PowerShell 例を使ってください。
ビルドは実行中の Docker 環境に合わせて `linux/amd64` または `linux/arm64` を選びます。

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

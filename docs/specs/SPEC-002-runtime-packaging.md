---
spec_id: SPEC-002
title: Docker実行とWindows/macOSインストール配布の実行要件
status: review
created: 2026-03-07
updated: 2026-03-20
author: Codex
related_specs: [SPEC-001]
---

# SPEC-002: Docker実行とWindows/macOSインストール配布の実行要件

## 概要
本仕様は、同一のTodoアプリをDockerコンテナとデスクトップインストールアプリ（Windows/macOS）として配布・実行する方法を定義する。
DockerモードではブラウザUI、デスクトップモードではアプリケーションウィンドウUIで動作させる。

## 対応要件（requirements.md）
| 要件ID | 要件概要 | 本仕様での実装機能ID |
|--------|----------|----------------------|
| FC-04-01-001 | sqlite永続化（全モード） | FR-003 |
| FC-04-02-001 | DockerでブラウザUI配信 | FR-001, FR-002 |
| FC-04-03-001 | ヘルスチェック提供 | FR-007 |
| FC-04-04-001 | host/port/data path設定 | FR-008 |
| FC-04-02-002 | デスクトップウィンドウ操作 | FR-001, FR-006 |
| FC-04-06-001 | Docker/Desktop挙動一致 | FR-009 |
| FC-04-05-001 | Windows配布形式 | FR-004 |
| FC-04-05-002 | macOS配布形式 | FR-005 |

## 機能仕様（要件実装一覧）
- [ ] FR-001: アプリは`docker`または`desktop`の起動モードで開始できる。現行実装ではDocker/Webランタイムのみ提供し、`desktop`モードは未実装。
- [x] FR-002: Dockerイメージにアプリバイナリと必要な実行アーティファクトを含め、`/`でブラウザUIを配信できる。現行実装では multi-stage Dockerfile の `runtime` ターゲットで軽量な実行イメージを生成し、Go バイナリは Docker のターゲットアーキテクチャ（例: `linux/amd64`, `linux/arm64`）に追従してビルドする。
- [ ] FR-003: Docker実行時は永続データディレクトリのマウントをサポートし、デスクトップ実行時はローカルデータディレクトリへ保存して、いずれもsqliteデータを再起動後に保持できる。現行実装ではDocker/Webランタイムで`APP_DATA_DIR`を起動時に自動作成し、bind mount 先が空でも書き込み可能な状態へ補正した上で`data_dir/todo.db`を保持する。デスクトップモードは未実装。
- [ ] FR-004: Windows向けにインストール可能な配布形式（例: installer + exe）を生成できる。
- [ ] FR-005: macOS向けにインストール可能な配布形式（例: .app + .dmg）を生成できる。
- [ ] FR-006: デスクトップモード起動時はアプリケーションウィンドウを表示し、外部ブラウザを必須としない。
- [x] FR-007: Dockerモードでは`GET /healthz`を公開し、運用監視に利用できる。
- [x] FR-008: `host`/`port`/`data_dir`の設定優先順位を「CLIフラグ > 環境変数 > デフォルト値」とする。現行実装では Docker 実行時も `APP_HOST` / `APP_PORT` / `APP_DATA_DIR` を使って上書きできる。
- [ ] FR-009: DockerモードとデスクトップモードでSPEC-001の中核挙動を同一に保つ。

### 優先度
| 要件 | 優先度 | 備考 |
|------|--------|------|
| FR-001 | 必須 | MVP |
| FR-002 | 必須 | MVP |
| FR-003 | 必須 | MVP |
| FR-004 | 必須 | MVP |
| FR-005 | 必須 | MVP |
| FR-006 | 必須 | MVP |
| FR-007 | 必須 | 運用監視 |
| FR-008 | 推奨 | 運用性 |
| FR-009 | 必須 | 仕様整合性 |

## 実装トレーサビリティ契約

| 機能ID | 実装ファイル | シンボル種別 | シンボル名 | テストファイル | テストID | 備考 |
|--------|--------------|--------------|------------|----------------|----------|------|
| FR-001 | Dockerfile | config | Dockerfile | 手動確認 | TC-001 | Docker起動モード |
| FR-001 | compose.yaml | config | compose.yaml | 手動確認 | TC-001 | Docker起動モード |
| FR-001 | cmd/server/main.go | function | main | 手動確認 | TC-001 | desktopモードは未実装 |
| FR-002 | Dockerfile | config | Dockerfile | 手動確認 | TC-003, TC-014 | multi-stage runtime ターゲット |
| FR-002 | compose.yaml | config | compose.yaml | 手動確認 | TC-003, TC-014 | |
| FR-002 | cmd/server/main.go | function | main | 手動確認 | TC-003 | `/`配信 |
| FR-003 | cmd/server/main.go | function | main | internal/todo/store_test.go | TC-004, TC-010 | データディレクトリ自動作成 |
| FR-003 | cmd/server/api.go | function | handleTodos | internal/todo/store_test.go | TC-004 | |
| FR-003 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-004 | |
| FR-003 | internal/todo/store.go | function | ListTodos | internal/todo/store_test.go | TC-004 | |
| FR-003 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-004 | |
| FR-003 | internal/todo/store.go | function | Open | internal/todo/store_test.go | TC-004 | sqlite永続化 |
| FR-003 | web/app.js | function | loadTodos | 手動確認 | TC-004 | |
| FR-003 | Dockerfile | config | Dockerfile | 手動確認 | TC-004 | |
| FR-003 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | 手動確認 | TC-004 | bind mount所有権補正 |
| FR-003 | compose.yaml | config | compose.yaml | 手動確認 | TC-004 | ボリュームマウント定義 |
| FR-004 | TBD | TBD | TBD | TBD | TC-005 | Windows配布未実装 |
| FR-005 | TBD | TBD | TBD | TBD | TC-006 | macOS配布未実装 |
| FR-006 | TBD | TBD | TBD | TBD | TC-007 | デスクトップモード未実装 |
| FR-007 | cmd/server/main.go | function | main | 手動確認 | TC-008 | GET /healthz |
| FR-008 | cmd/server/main.go | function | envOrDefault | 手動確認 | TC-002 | 設定優先順位 |
| FR-008 | cmd/server/main.go | function | main | 手動確認 | TC-002 | CLIフラグ/環境変数解決 |
| FR-008 | Dockerfile | config | Dockerfile | 手動確認 | TC-002 | デフォルト値定義 |
| FR-008 | compose.yaml | config | compose.yaml | 手動確認 | TC-002 | 環境変数マッピング |
| FR-009 | TBD | TBD | TBD | TBD | TC-009 | Docker/Desktop挙動一致は未実装 |
| NFR-006 | Dockerfile | config | Dockerfile | 手動確認 | TC-011 | docker run 1コマンド起動 |
| NFR-006 | compose.yaml | config | compose.yaml | 手動確認 | TC-011 | docker run 1コマンド起動 |
| NFR-006 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | 手動確認 | TC-011 | docker run 1コマンド起動 |
| NFR-007 | TBD | TBD | TBD | TBD | TC-012 | デスクトップ未実装 |
| NFR-008 | Dockerfile | config | Dockerfile | GitHub Actions | TC-013 | CIビルド対象 |
| NFR-008 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | GitHub Actions | TC-013 | |
| NFR-008 | compose.yaml | config | compose.yaml | GitHub Actions | TC-013 | profile test含む |
| NFR-008 | .github/workflows/ci.yml | workflow | docker job | GitHub Actions | TC-013 | Dockerベーステスト・healthz検証 |
| NFR-001 | Dockerfile | config | Dockerfile | 手動確認 | TC-039, TC-040, TC-041 | コールドスタート計測対象 |
| NFR-002 | TBD | TBD | TBD | TBD | TC-042, TC-043, TC-044 | デスクトップ未実装 |
| NFR-003 | Dockerfile | config | Dockerfile | 手動確認 | TC-045, TC-046, TC-047 | multi-stage build |
| NFR-004 | cmd/server/main.go | function | main | 手動確認 | TC-048, TC-049, TC-050 | 起動ログ出力 |
| NFR-005 | TBD | TBD | TBD | TBD | TC-051, TC-052, TC-053 | CI配布未実装 |

## 実装完了条件

| 機能ID | 観測可能な結果 | テストID | 自動化 | 備考 |
|--------|----------------|----------|--------|------|
| FR-001 | `docker compose up` で起動モード`docker`としてプロセスが開始し、ログに起動モードが出力される | TC-001 | 手動 | desktopモードは別途実装 |
| FR-002 | `docker compose up -d --build` 後に `http://localhost:8080/` でブラウザUIが配信される | TC-003 | CI | |
| FR-002 | `linux/arm64` ターゲットでもDockerイメージがビルド・起動できる | TC-014 | 手動 | |
| FR-003 | Docker bind mount先が空の状態から起動し、Todo作成後に `docker compose restart` してもデータが保持される | TC-004 | 手動 | |
| FR-003 | デスクトップモードで再起動後もsqliteデータが保持される | TC-010 | 手動 | 未実装 |
| FR-004 | Windowsインストーラーで導入後にアプリが起動しUIが表示される | TC-005 | 手動 | 未実装 |
| FR-005 | macOS `.app`/`.dmg` 経由で導入後にアプリが起動しUIが表示される | TC-006 | 手動 | 未実装 |
| FR-006 | デスクトップモード起動時にアプリケーションウィンドウが表示され、外部ブラウザなしで操作できる | TC-007 | 手動 | 未実装 |
| FR-007 | `GET /healthz` が HTTP 200 と `{"status":"ok"}` を返す | TC-008 | CI | healthz検証はCI内で自動実行 |
| FR-008 | CLIフラグ `--port 9090` が環境変数 `APP_PORT=8080` より優先され、9090で起動する | TC-002 | 手動 | |
| FR-009 | Docker/デスクトップ両モードでSPEC-001の中核API・UI挙動が同一結果を返す | TC-009 | 手動 | 未実装 |
| NFR-001 | コンテナのコールドスタートが5秒未満で完了する | TC-039, TC-040, TC-041 | 手動 | |
| NFR-002 | デスクトップアプリ起動が3秒未満で完了する | TC-042, TC-043, TC-044 | 手動 | 未実装 |
| NFR-003 | `docker images` で実行イメージサイズが150MB未満である | TC-045, TC-046, TC-047 | 手動 | |
| NFR-004 | 起動ログに起動モード・バインドアドレス・データパスが出力される | TC-048, TC-049, TC-050 | CI | ログ目視またはCI出力で確認 |
| NFR-005 | Windows/macOS配布物の作成がCIワークフローで自動実行される | TC-051, TC-052, TC-053 | CI | 未実装 |
| NFR-006 | `docker run` 1コマンドでアプリが起動しUIにアクセスできる | TC-011 | 手動 | |
| NFR-007 | クリーン環境のWindows/macOSで追加ランタイムなしにアプリが起動する | TC-012 | 手動 | 未実装 |
| NFR-008 | GitHub Actions上でDockerベースのテスト実行・ビルド・healthz検証が成功する | TC-013 | CI | |

## 非機能要件
- [ ] NFR-001: 標準的なローカル開発環境でコンテナのコールドスタートを5秒未満とする。
- [ ] NFR-002: デスクトップアプリ起動を3秒未満とする。
- [ ] NFR-003: Dockerイメージサイズ目標を150MB未満とする。
- [x] NFR-004: 実行ログに起動モード、バインドアドレス、データパスを含める。
- [ ] NFR-005: Windows/macOS配布物の作成手順をCIで自動実行可能にする。
- [x] NFR-006: ローカル実行時に`docker run` 1コマンドで起動できるように、必要な環境変数/ボリューム指定を最小化する。現行実装では `docker build --target runtime ...` と `docker run ...`、または `docker compose up -d --build` だけでホストにGo/Nodeを入れず起動できる。
- [ ] NFR-007: Windows/macOS配布物は必要ランタイムを同梱し、手動インストールなしで起動できる。
- [x] NFR-008: CIではホストにGo/Nodeを前提とせず、Dockerベースでビルド・テスト・ヘルスチェックを自動実行できる。現行実装では GitHub Actions が `docker compose config`、`docker compose --profile test run --no-deps --rm todo-test`、`docker compose build todo-app`、`docker compose up -d todo-app` と `/healthz` 検証を実行し、コンテナ異常終了時はログを出して fail fast する。

## データモデル

### RuntimeConfig
| フィールド | 型 | 必須 | 説明 |
|------------|----|------|------|
| host | string | no | Docker時のバインドアドレス。デフォルトは`0.0.0.0` |
| port | integer | no | Docker時のバインドポート。デフォルトは`8080` |
| data_dir | string | yes | sqlite DBファイル格納パス |
| mode | string | yes | 現行実装では実質`docker`/`web`相当のみ |
| desktop_window | boolean | no | デスクトップモード実装時に利用予定 |

## API仕様

### GET /healthz
レスポンス 200:
```json
{
  "status": "ok"
}
```

## テスト仕様

### グループA: 起動モードと配信
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-001 | FR-001 | `docker`/`desktop`のモード指定で起動できる | 正常系 |
| TC-015 | FR-001 | 不正なモード文字列を指定すると起動が拒否される | 異常系 |
| TC-016 | FR-001 | モード指定なしの場合にデフォルトモードで起動する | 境界値 |
| TC-003 | FR-002 | Dockerイメージが起動し`/`を配信する | 正常系 |
| TC-014 | FR-002 | Dockerビルドが固定`amd64`に依存せず、ターゲットアーキテクチャに追従して実行イメージを生成できる | 正常系 |
| TC-017 | FR-002 | Dockerイメージのビルドに必要なファイルが欠落している場合にビルドが明確なエラーで失敗する | 異常系 |
| TC-018 | FR-002 | 最小限のソース変更後に再ビルドが成功する | 境界値 |

### グループB: データ永続化
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-004 | FR-003 | Dockerマウントボリュームでデータが永続化される | 正常系 |
| TC-010 | FR-003 | デスクトップモードで再起動後もsqliteデータが保持される | 正常系 |
| TC-019 | FR-003 | マウント先ディレクトリが読み取り専用の場合に明確なエラーメッセージが表示される | 異常系 |
| TC-020 | FR-003 | bind mount先が空の状態から起動してもsqliteが正常に初期化される | 境界値 |

### グループC: デスクトップ配布
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-005 | FR-004 | Windowsインストーラーで導入後に起動できる | 正常系 |
| TC-021 | FR-004 | インストーラーをキャンセルした場合にファイルが残らない | 異常系 |
| TC-022 | FR-004 | 既存バージョンがインストール済みの状態で上書きインストールできる | 境界値 |
| TC-006 | FR-005 | macOS `.app`/`.dmg`経由で導入後に起動できる | 正常系 |
| TC-023 | FR-005 | 未署名の`.app`がmacOSのセキュリティ警告を表示する | 異常系 |
| TC-024 | FR-005 | `.dmg`マウント後に`.app`をApplicationsへコピーして起動できる | 境界値 |
| TC-007 | FR-006 | デスクトップ起動時にアプリケーションウィンドウが表示される | 正常系 |
| TC-025 | FR-006 | デスクトップ起動時に外部ブラウザが自動起動しない | 異常系 |
| TC-026 | FR-006 | ウィンドウを閉じるとプロセスが終了する | 境界値 |

### グループD: ヘルスチェックと設定
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-008 | FR-007 | `/healthz`が200と`status=ok`を返す | 正常系 |
| TC-027 | FR-007 | サーバー起動中（初期化未完了）の`/healthz`が適切なレスポンスを返す | 異常系 |
| TC-028 | FR-007 | 不正なHTTPメソッド（POST）で`/healthz`にアクセスした場合の挙動が適切である | 境界値 |
| TC-002 | FR-008 | `host`/`port`/`data_dir`でCLIフラグが環境変数より優先される | 正常系 |
| TC-029 | FR-008 | 不正なポート番号（例: -1, 99999）を指定すると起動が拒否される | 異常系 |
| TC-030 | FR-008 | CLIフラグ・環境変数ともに未指定の場合にデフォルト値で起動する | 境界値 |

### グループE: モード間整合性
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-009 | FR-009 | Docker/デスクトップで中核挙動が一致する | 正常系 |
| TC-031 | FR-009 | 片方のモードだけで発生するエラーが存在しないことを確認する | 異常系 |
| TC-032 | FR-009 | 同一データベースファイルをDocker/デスクトップで交互に利用できる | 境界値 |

### グループF: 運用・CI
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-011 | NFR-006 | ローカル実行時に`docker run` 1コマンドで起動できる | 正常系 |
| TC-033 | NFR-006 | `docker run`で必須の環境変数/ボリューム指定なしでも起動できる | 境界値 |
| TC-034 | NFR-006 | 不正なイメージ名を指定した場合に明確なエラーが表示される | 異常系 |
| TC-012 | NFR-007 | クリーン環境のWindows/macOSで追加ランタイムなしに起動できる | 正常系 |
| TC-035 | NFR-007 | 競合するランタイムがインストール済みの環境でも正常に起動できる | 異常系 |
| TC-036 | NFR-007 | インストール後の初回起動で必要な初期化が自動実行される | 境界値 |
| TC-013 | NFR-008 | CI相当の手順でDockerベースのテスト実行、実行イメージのビルド、`/healthz`の起動確認ができる | 正常系 |
| TC-037 | NFR-008 | CIでDockerデーモンが停止している場合に明確なエラーで失敗する | 異常系 |
| TC-038 | NFR-008 | CIキャッシュなしの初回ビルドが成功する | 境界値 |

### グループG: 性能・サイズ・ログ
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-039 | NFR-001 | コンテナのコールドスタートが5秒未満で完了する | 正常系 |
| TC-040 | NFR-001 | 大量データ存在時でもコールドスタートが5秒未満で完了する | 境界値 |
| TC-041 | NFR-001 | ホストリソースが逼迫した状態でも起動がタイムアウトしない | 異常系 |
| TC-042 | NFR-002 | デスクトップアプリ起動が3秒未満で完了する | 正常系 |
| TC-043 | NFR-002 | 大量データ存在時でもデスクトップ起動が3秒未満で完了する | 境界値 |
| TC-044 | NFR-002 | 起動失敗時にエラーダイアログが3秒以内に表示される | 異常系 |
| TC-045 | NFR-003 | Dockerイメージサイズが150MB未満である | 正常系 |
| TC-046 | NFR-003 | 不要なビルドアーティファクトがイメージに含まれていない | 異常系 |
| TC-047 | NFR-003 | multi-stage buildの各ステージが適切にキャッシュされる | 境界値 |
| TC-048 | NFR-004 | 起動ログに起動モード、バインドアドレス、データパスが出力される | 正常系 |
| TC-049 | NFR-004 | ログにパスワードやシークレットが含まれない | 異常系 |
| TC-050 | NFR-004 | 全設定項目がデフォルト値の場合でもログに正しく出力される | 境界値 |
| TC-051 | NFR-005 | CIワークフローでWindows/macOS配布物が自動生成される | 正常系 |
| TC-052 | NFR-005 | 署名証明書がない場合にビルドが明確なエラーで失敗する | 異常系 |
| TC-053 | NFR-005 | バージョン番号が配布物のファイル名とメタデータに正しく反映される | 境界値 |

## 依存関係
| 依存先 | 種別 | 説明 |
|--------|------|------|
| SPEC-001 | 内部 | APIおよびUI挙動の契約 |
| Docker | 外部 | コンテナ実行環境 |
| Go toolchain | 外部 | ビルド基盤 |
| デスクトップアプリフレームワーク | 外部 | Windows/macOSアプリ化（例: Wails） |

## 判断記録
| 日付 | 判断内容 | 理由 |
|------|---------|------|
| 2026-03-07 | 単一バックエンドプロセスでAPIと静的UIを配信する | Dockerとデスクトップの同等性を維持しやすいため |
| 2026-03-07 | sqliteのファイルベース永続化を採用する | コンテナボリュームとローカルアプリの両方で扱いやすいため |
| 2026-03-07 | デスクトップ利用時は専用ウィンドウUIを標準とする | インストールアプリとしての利用体験を優先するため |
| 2026-03-14 | 現行Webランタイムでは`data_dir/todo.db`へTodoを保存する | Dockerボリュームと将来のデスクトップローカル保存先を同じ責務で扱えるようにするため |
| 2026-03-14 | 現行のDocker運用ではソース変更後に`docker compose up -d --build`での再ビルドを前提とする | 既存イメージ再利用時に最新コードが反映されない運用事故を避けるため |
| 2026-03-20 | ローカル確認とCI検証はホストのGo/Nodeではなく Docker コンテナを正とする | 開発者環境差分を減らし、ローカルとCIの検証条件を一致させるため |
| 2026-03-20 | Dockerランタイムは起動時に`APP_DATA_DIR`を自動作成し、bind mount の所有権を補正してから非rootで起動する | GitHub Actions などの fresh checkout でも SQLite 初期化失敗を防ぐため |
| 2026-03-20 | Dockerビルド時の Go バイナリは固定`amd64`ではなくターゲットアーキテクチャへ追従させる | Apple Silicon や arm64 Linux でも同じ Dockerfile / compose 手順で起動できるようにするため |

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
| FC-04-05-001 | Windows配布形式 | FR-004 |
| FC-04-05-002 | macOS配布形式 | FR-005 |
| FC-04-06-001 | Docker/Desktop挙動一致 | FR-009 |

## 機能仕様（実行・配布）
- [ ] FR-001: アプリは`docker`または`desktop`の起動モードで開始できる。現行実装ではDocker/Webランタイムのみ提供し、`desktop`モードは未実装。
- [x] FR-002: Dockerイメージにアプリバイナリと必要な実行アーティファクトを含め、`/`でブラウザUIを配信できる。現行実装では multi-stage Dockerfile の `runtime` ターゲットで軽量な実行イメージを生成する。
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
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-001 | FR-001 | `docker`/`desktop`のモード指定で起動できる | 正常系 |
| TC-002 | FR-008 | `host`/`port`/`data_dir`でCLIフラグが環境変数より優先される | 優先順位 |
| TC-003 | FR-002 | Dockerイメージが起動し`/`を配信する | 結合テスト |
| TC-004 | FR-003 | Dockerマウントボリュームでデータが永続化される | 結合テスト |
| TC-005 | FR-004 | Windowsインストーラーで導入後に起動できる | 結合テスト |
| TC-006 | FR-005 | macOS `.app`/`.dmg`経由で導入後に起動できる | 結合テスト |
| TC-007 | FR-006 | デスクトップ起動時にアプリケーションウィンドウが表示される | 結合テスト |
| TC-008 | FR-007 | `/healthz`が200と`status=ok`を返す | 正常系 |
| TC-009 | FR-009 | Docker/デスクトップで中核挙動が一致する | 比較テスト |
| TC-010 | FR-003 | デスクトップモードで再起動後もsqliteデータが保持される | 結合テスト |
| TC-011 | NFR-006 | ローカル実行時に`docker run` 1コマンドで起動できる | 運用テスト |
| TC-012 | NFR-007 | クリーン環境のWindows/macOSで追加ランタイムなしに起動できる | 結合テスト |
| TC-013 | NFR-008 | CI相当の手順で Docker ベースのテスト実行、実行イメージのビルド、`/healthz` の起動確認ができる | CI結合テスト |

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

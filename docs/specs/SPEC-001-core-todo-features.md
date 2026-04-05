---
spec_id: SPEC-001
title: Todo基本機能とクライアントUI（Web/デスクトップ）
status: review
created: 2026-03-07
updated: 2026-04-05
author: Codex
related_specs: [SPEC-002]
---

# SPEC-001: Todo基本機能とクライアントUI（Web/デスクトップ）

## 概要
本仕様は、Todoの中核挙動とUI操作要件を定義する。
DockerモードではブラウザUI、デスクトップアプリモードではアプリケーションウィンドウUIを提供し、操作結果の挙動を一致させる。

## 対応要件（requirements.md）
| 要件ID | 要件概要 | 本仕様での実装機能ID |
|--------|----------|----------------------|
| FC-01-01-001 | Todo作成 | FR-001, FR-004 |
| FC-01-01-002 | Todo編集 | FR-002 |
| FC-01-01-003 | Todo削除 | FR-003 |
| FC-01-02-001 | Todo全体表示 | FR-005 |
| FC-01-02-002 | 今日着手すべきTodo表示 | FR-008 |
| FC-01-02-003 | 期限切れTodo表示 | FR-022 |
| FC-01-02-004 | 完了Todo表示 | FR-023 |
| FC-01-02-005 | 今後Todo表示 | FR-024 |
| FC-01-03-001 | 状態変更 | FR-006 |
| FC-01-03-002 | 状態絞り込み | FR-007 |
| FC-02-01-002 | 開始予定日（JST） | FR-009 |
| FC-02-01-001 | 締め切り（JST） | FR-010 |
| FC-02-02-001 | 担当者紐づけ | FR-011 |
| FC-02-03-001 | プロジェクト紐づけ | FR-012 |
| FC-02-03-002 | プロジェクト事前作成・再利用 | FR-021 |
| FC-03-01-001 | 親子関係設定 | FR-013 |
| FC-03-01-002 | 循環/自己参照防止 | FR-014 |
| FC-04-02-002 | デスクトップウィンドウ操作 | FR-016 |
| FC-04-06-001 | Docker/Desktop挙動一致 | FR-017 |
| FC-04-07-001 | バックアップ エクスポート/インポート | FR-020 |
| FC-05-01-001 | UI即時反映（全体リロードなし） | FR-015 |
| FC-05-02-001 | 開始予定日/締め切り通知 | FR-018 |
| FC-06-01-001 | 繰り返しタスク | FR-019 |

## 機能仕様（要件実装一覧）

### グループA: 基本CRUDと入力検証
- [x] FR-001: ユーザーは`title`必須、メモ（`description`）任意でTodoを作成できる。
- [x] FR-002: ユーザーはTodoのタイトルとメモ（`description`）を更新できる。現行実装ではTodo一覧の編集ボタンから既存値をフォームへ読み込み、編集フォームを開いてその位置までスクロールし、タイトル入力へフォーカスしたうえで`PATCH /api/todos/{id}`で保存する。
- [x] FR-003: ユーザーはTodoを削除できる。現行実装では削除ボタン押下時に確認ダイアログを表示し、確認後に`DELETE /api/todos/{id}`を実行する。
- [x] FR-004: バリデーションにより空タイトルおよび120文字超過タイトルを拒否する。

### グループB: 一覧・絞り込み・状態遷移
- [x] FR-005: ユーザーはTodo全体を新しい順で閲覧できる。現行実装では一覧ヘッダーのビュー切り替えで`すべてのTodo`を選ぶと、状態や開始予定日時に関係なく全件を表示する。
- [x] FR-006: ユーザーはTodo状態を`active`、`in_progress`、`waiting`、`completed`に変更できる。現行実装では一覧行の状態列に現在状態バッジを表示し、各行の詳細を開いたときだけ4状態の軽量セグメントコントロールを表示して変更できる。
- [ ] FR-007: ユーザーは`all`、`active`、`in_progress`、`waiting`、`completed`で絞り込める。現行実装では`GET /api/todos?status=...`のAPIのみ対応し、UIフィルターは未実装。
- [x] FR-008: ユーザーは今日着手すべきTodoだけを一覧表示できる。現行実装では一覧ヘッダーのビュー切り替えで`今日やるTodo`を選ぶと、JST基準で`active`、`in_progress`、`waiting`のみを対象とし、`completed`は表示しない。`start_date`未設定Todoは即着手可能として表示し、`start_date`設定済みTodoはその日時以後に表示する。
- [x] FR-022: ユーザーは期限切れの未完了Todoだけを一覧表示できる。現行実装では一覧タブで`期限切れ`を選ぶと、JST基準で`due_date`が現在日時より前、かつ`completed`以外のTodoのみを表示する。`due_date`未設定Todoは含めない。
- [x] FR-023: ユーザーは完了したTodoだけを一覧表示できる。現行実装では一覧タブで`完了`を選ぶと、`completed`状態のTodoのみを表示する。
- [x] FR-024: ユーザーは今後着手予定のTodoだけを一覧表示できる。現行実装では一覧タブで`今後`を選ぶと、JST基準で`active`、`in_progress`、`waiting`のうち、`start_date`が現在日時より後のTodoのみを表示する。`start_date`未設定Todoは含めない。

### グループC: 属性管理（開始予定日・締め切り・担当者・プロジェクト）
- [x] FR-009: ユーザーはTodoに開始予定日時（`start_date`）を日本時刻（JST, UTC+09:00）で設定・更新・解除できる。現行実装では作成フォームと編集フォームの両方から設定・解除でき、開始時刻入力欄のクリックでネイティブタイムピッカーを開ける。サーバー側でもJST前提の形式検証を行う。
- [x] FR-010: ユーザーはTodoに締め切り日時（`due_date`）を日本時刻（JST, UTC+09:00）で設定・更新・解除できる。`start_date`が設定されている場合、`due_date`は`start_date`以降のみ許可する。現行実装では作成/編集フォームとサーバー側の整合チェックで担保し、締切時刻入力欄のクリックでネイティブタイムピッカーを開ける。
- [x] FR-011: ユーザーはTodoに担当者（1件）を紐づけ・解除できる。現行実装では担当者名を自由入力の文字列としてTodoへ保存し、作成/編集フォームから更新できる。
- [x] FR-012: ユーザーは事前作成したプロジェクト（0または1件）をTodoへ紐づけ・解除できる。現行実装ではTodo作成/編集フォームの主要項目側に検索対応の単一選択コンボボックスUIを配置し、閉じた状態では選択済みプロジェクト名または`プロジェクトなし`を表示し、クリックで候補一覧を開ける。
- [x] FR-021: ユーザーはTodo作成フォーム近傍のUIからプロジェクトを事前作成・編集・削除し、以後のTodo作成・編集フォームで再利用できる。現行実装では`GET/POST/PATCH/DELETE /api/projects`で永続化し、ドロップダウン内の検索入力、補助アクション、下部の小型作成UIからプロジェクトを作成し、`プロジェクトを管理`から管理ダイアログを開ける。

### グループD: 親子タスク管理
- [x] FR-013: ユーザーはTodo同士の親子関係を設定・解除できる（親は1件、子は複数）。現行実装では作成/編集フォームから親Todoを指定でき、一覧と詳細表示の両方で親タスク名を表示する。
- [x] FR-014: 親子関係設定時に自己参照と循環参照を防止する。親Todoを削除した場合、子Todoの`parent_todo_id`は`null`へ更新する。現行実装ではサーバー側で循環/自己参照を拒否し、Web UIでも編集中Todo自身は親候補から除外する。

### グループE: クライアントUIモード
- [x] FR-015: UIはページ全体の再読み込みなしで作成・更新・削除・状態変更を反映する。現行実装では折りたたみの作成入口に補助文と入力途中サマリを表示し、追加モードでは`キャンセル/追加する`、編集モードでは`編集をキャンセル/更新する`を表示する。キャンセル時は入力を破棄してフォームを折りたたむ。新規追加成功後はフォームを開いたまま次の入力へ移れ、詳細設定の開閉状態も維持する。編集更新成功後はフォームを折りたたんで通常状態へ戻る。
- [ ] FR-016: デスクトップアプリモードでは外部ブラウザを使わず、アプリケーションウィンドウ内でTodo操作が完結する。
- [ ] FR-017: Web UIとデスクトップUIで提供する機能（作成/編集/削除/絞り込み）は同等である。

### グループF: 通知・自動化・バックアップ
- [x] FR-018: ユーザーは開始予定日/締め切りの到達前通知をアプリ内で受け取れる。通知タイミング（何分前に通知するか）はユーザー設定で変更できる。現行実装では通知判定と設定保持はクライアント内状態で行う。
- [x] FR-019: ユーザーは繰り返しルール（毎日/毎週/毎月）を設定でき、完了時に次回タスクを自動生成できる。現行実装ではWeb UIで状態を`completed`へ変更した際に次回Todoを生成する。
- [ ] FR-020: ユーザーはTodoデータ（Todo/担当者/プロジェクト/親子関係）をエクスポート/インポートできる（MVPではdry-run/merge/replace選択などの安全機能は対象外）。

### 優先度
| 要件 | 優先度 | 備考 |
|------|--------|------|
| FR-001 | 必須 | MVP |
| FR-002 | 必須 | MVP |
| FR-003 | 必須 | MVP |
| FR-004 | 必須 | MVP |
| FR-005 | 必須 | MVP |
| FR-006 | 必須 | MVP |
| FR-007 | 必須 | MVP |
| FR-008 | 必須 | 当日運用性 |
| FR-022 | 必須 | 期限超過確認 |
| FR-023 | 必須 | 完了履歴確認 |
| FR-024 | 必須 | 先行予定確認 |
| FR-009 | 必須 | 着手計画性 |
| FR-010 | 必須 | タスク計画性 |
| FR-011 | 必須 | 担当管理 |
| FR-012 | 必須 | プロジェクト管理 |
| FR-021 | 必須 | プロジェクト再利用 |
| FR-013 | 必須 | タスク分解 |
| FR-014 | 必須 | データ整合性 |
| FR-015 | 推奨 | UX品質 |
| FR-016 | 必須 | デスクトップ利用要件 |
| FR-017 | 必須 | モード間一貫性 |
| FR-018 | 必須 | 期限管理 |
| FR-019 | 必須 | 定期タスク運用 |
| FR-020 | 必須 | バックアップ/復元 |

## 実装トレーサビリティ契約

| 機能ID | 実装ファイル | シンボル種別 | シンボル名 | テストファイル | テストID | 備考 |
|--------|--------------|--------------|------------|----------------|----------|------|
| FR-001 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-001 | Todo作成APIハンドラ |
| FR-001 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-001 | Todo作成ストア処理 |
| FR-001 | web/app.js | function | createTodo | 手動確認 | TC-001, TC-047 | クライアント側作成処理 |
| FR-002 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-002, TC-040 | Todo更新APIハンドラ |
| FR-002 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-002 | Todo更新ストア処理 |
| FR-002 | web/app.js | function | submitTodoForm | 手動確認 | TC-002, TC-040 | フォーム送信処理 |
| FR-002 | web/app.js | function | updateTodo | 手動確認 | TC-002 | クライアント側更新処理 |
| FR-002 | web/app.js | function | beginEditing | 手動確認 | TC-040 | 編集モード開始 |
| FR-002 | web/app.js | function | scrollTodoFormIntoView | 手動確認 | TC-040 | 編集フォームへスクロール |
| FR-002 | web/app.js | function | focusTodoTitleField | 手動確認 | TC-040 | タイトル入力へフォーカス |
| FR-003 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-003, TC-034 | Todo削除APIハンドラ |
| FR-003 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-003 | Todo削除ストア処理 |
| FR-003 | web/app.js | function | deleteTodo | 手動確認 | TC-003 | クライアント側削除処理 |
| FR-003 | web/app.js | function | promptDeleteTodo | 手動確認 | TC-034 | 削除確認ダイアログ表示 |
| FR-003 | web/app.js | function | confirmDeleteTodo | 手動確認 | TC-003, TC-034 | 削除確認後実行 |
| FR-004 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-004, TC-005 | バリデーション付き作成ハンドラ |
| FR-004 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-004, TC-005 | タイトルバリデーション |
| FR-004 | web/app.js | function | createTodo | 手動確認 | TC-004, TC-005 | クライアント側バリデーション |
| FR-005 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-006 | 一覧取得APIハンドラ |
| FR-005 | internal/todo/store.go | function | ListTodos | internal/todo/store_test.go | TC-006 | 一覧取得ストア処理 |
| FR-005 | web/app.js | function | renderTodoView | 手動確認 | TC-006, TC-039, TC-045, TC-046 | ビュー描画 |
| FR-005 | web/app.js | function | getVisibleTodos | 手動確認 | TC-006 | 表示対象フィルタリング |
| FR-005 | web/app.js | function | getTodoHeadingText | 手動確認 | TC-006 | 見出しテキスト生成 |
| FR-005 | web/app.js | function | renderTodoList | 手動確認 | TC-006, TC-039, TC-046 | 一覧描画 |
| FR-005 | web/app.js | function | renderTodoRow | 手動確認 | TC-045, TC-046 | 行描画 |
| FR-005 | web/app.js | function | toggleTodoDetails | 手動確認 | TC-045 | 詳細開閉 |
| FR-006 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-008, TC-009, TC-010, TC-011, TC-012 | 状態変更APIハンドラ |
| FR-006 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-008, TC-009, TC-010, TC-011, TC-012 | 状態変更ストア処理 |
| FR-006 | web/app.js | function | patchTodo | 手動確認 | TC-008, TC-038 | クライアント側パッチ処理 |
| FR-006 | web/app.js | function | setTodoStatus | 手動確認 | TC-038 | 状態設定 |
| FR-006 | web/app.js | function | renderStatusButtons | 手動確認 | TC-038 | 状態変更UI描画 |
| FR-006 | web/app.js | function | getStatusText | 手動確認 | TC-038 | 状態テキスト取得 |
| FR-007 | cmd/server/api.go | handler | handleTodos | 手動確認 | TC-007 | 絞り込みAPIハンドラ |
| FR-007 | internal/todo/store.go | function | ListTodos | 手動確認 | TC-007 | 絞り込みストア処理 |
| FR-008 | cmd/server/api.go | handler | handleTodos | 手動確認 | TC-024, TC-025 | 今日表示APIハンドラ |
| FR-008 | internal/todo/store.go | function | ListTodos | 手動確認 | TC-024, TC-025 | 今日表示ストア処理 |
| FR-008 | web/app.js | function | renderTodoView | 手動確認 | TC-024, TC-025, TC-049 | 今日ビュー描画 |
| FR-008 | web/app.js | function | getVisibleTodos | 手動確認 | TC-024, TC-025 | 今日フィルタ |
| FR-008 | web/app.js | function | isTodoVisibleToday | 手動確認 | TC-024, TC-025 | 当日表示判定 |
| FR-008 | web/app.js | function | isStartDateAvailableToday | 手動確認 | TC-024, TC-025 | 開始日到来判定 |
| FR-009 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-016, TC-044 | 開始予定日設定APIハンドラ |
| FR-009 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-016 | 開始予定日更新APIハンドラ |
| FR-009 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-016 | 開始予定日作成処理 |
| FR-009 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-016 | 開始予定日更新処理 |
| FR-009 | internal/todo/store.go | function | validateTodoValues | internal/todo/store_test.go | TC-016 | 日時バリデーション |
| FR-009 | web/app.js | function | applyStoredDateTime | 手動確認 | TC-016 | 保存日時の反映 |
| FR-009 | web/app.js | function | combineDateAndTime | 手動確認 | TC-016 | 日付と時刻の結合 |
| FR-009 | web/app.js | function | bindTimeFieldPicker | 手動確認 | TC-044, TC-048 | 時刻入力バインド |
| FR-009 | web/app.js | function | openTimePicker | 手動確認 | TC-044, TC-048 | タイムピッカー起動 |
| FR-010 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-013, TC-044 | 締切設定APIハンドラ |
| FR-010 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-013 | 締切更新APIハンドラ |
| FR-010 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-013 | 締切作成処理 |
| FR-010 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-013 | 締切更新処理 |
| FR-010 | internal/todo/store.go | function | validateTodoValues | internal/todo/store_test.go | TC-013 | 日時バリデーション |
| FR-010 | web/app.js | function | applyStoredDateTime | 手動確認 | TC-013 | 保存日時の反映 |
| FR-010 | web/app.js | function | bindTimeFieldPicker | 手動確認 | TC-044, TC-048 | 時刻入力バインド |
| FR-010 | web/app.js | function | openTimePicker | 手動確認 | TC-044, TC-048 | タイムピッカー起動 |
| FR-011 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-014 | 担当者設定APIハンドラ |
| FR-011 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-014 | 担当者更新APIハンドラ |
| FR-011 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-014 | 担当者作成処理 |
| FR-011 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-014 | 担当者更新処理 |
| FR-011 | web/app.js | function | buildTodoFromForm | 手動確認 | TC-014 | フォームからTodo構築 |
| FR-011 | web/app.js | function | updateTodo | 手動確認 | TC-014 | クライアント側更新処理 |
| FR-011 | web/app.js | function | renderTodoList | 手動確認 | TC-014 | 担当者表示 |
| FR-012 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-015 | プロジェクト紐づけAPIハンドラ |
| FR-012 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-015 | プロジェクト更新APIハンドラ |
| FR-012 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-015 | プロジェクト紐づけ作成処理 |
| FR-012 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-015 | プロジェクト紐づけ更新処理 |
| FR-012 | internal/todo/store.go | function | ensureProjectReference | internal/todo/store_test.go | TC-015 | プロジェクト参照確認 |
| FR-012 | web/app.js | function | buildTodoFromForm | 手動確認 | TC-015 | フォームからTodo構築 |
| FR-012 | web/app.js | function | openProjectPicker | 手動確認 | TC-015 | プロジェクトピッカー表示 |
| FR-012 | web/app.js | function | getFilteredProjects | 手動確認 | TC-015 | プロジェクト検索フィルタ |
| FR-012 | web/app.js | function | selectProjectByID | 手動確認 | TC-015 | プロジェクト選択 |
| FR-012 | web/app.js | function | renderProjectField | 手動確認 | TC-015 | プロジェクト欄描画 |
| FR-012 | web/app.js | function | renderProjectOptions | 手動確認 | TC-015 | プロジェクト候補描画 |
| FR-013 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-017 | 親子設定APIハンドラ |
| FR-013 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-017 | 親子更新APIハンドラ |
| FR-013 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-017 | 親子設定作成処理 |
| FR-013 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-017 | 親子設定更新処理 |
| FR-013 | internal/todo/store.go | function | validateParentReference | internal/todo/store_test.go | TC-017 | 親参照検証 |
| FR-013 | web/app.js | function | renderParentOptions | 手動確認 | TC-017 | 親タスク候補描画 |
| FR-013 | web/app.js | function | updateTodo | 手動確認 | TC-017 | クライアント側更新処理 |
| FR-013 | web/app.js | function | renderTodoList | 手動確認 | TC-017 | 親タスク名表示 |
| FR-013 | web/app.js | function | getParentTodoDisplay | 手動確認 | TC-017 | 親タスク表示名取得 |
| FR-014 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-018, TC-019, TC-020 | 循環防止APIハンドラ |
| FR-014 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-018, TC-019 | 循環防止更新処理 |
| FR-014 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-020 | 親削除時の子更新 |
| FR-014 | internal/todo/store.go | function | validateParentReference | internal/todo/store_test.go | TC-018, TC-019 | 循環/自己参照検証 |
| FR-014 | web/app.js | function | renderParentOptions | 手動確認 | TC-018 | 自己除外の親候補描画 |
| FR-014 | web/app.js | function | deleteTodo | 手動確認 | TC-020 | 削除後の親子解除 |
| FR-015 | web/app.js | function | submitTodoForm | 手動確認 | TC-023, TC-036, TC-037 | フォーム送信処理 |
| FR-015 | web/app.js | function | createTodo | 手動確認 | TC-023, TC-037 | 即時反映の作成処理 |
| FR-015 | web/app.js | function | updateTodo | 手動確認 | TC-023, TC-037 | 即時反映の更新処理 |
| FR-015 | web/app.js | function | clearForm | 手動確認 | TC-036 | フォームクリア |
| FR-015 | web/app.js | function | deleteTodo | 手動確認 | TC-023 | 即時反映の削除処理 |
| FR-015 | web/app.js | function | patchTodo | 手動確認 | TC-023 | 即時反映のパッチ処理 |
| FR-015 | web/app.js | function | loadTodos | 手動確認 | TC-023 | Todo読み込み |
| FR-015 | web/app.js | function | render | 手動確認 | TC-023 | 全体描画 |
| FR-015 | web/app.js | function | updateFormMode | 手動確認 | TC-036 | フォームモード切替 |
| FR-015 | web/app.js | function | cancelEditing | 手動確認 | TC-036 | 編集キャンセル |
| FR-015 | web/app.js | function | syncCreateSummary | 手動確認 | TC-035 | 入力途中サマリ同期 |
| FR-015 | web/app.js | function | buildFormPreview | 手動確認 | TC-035 | フォームプレビュー構築 |
| FR-016 | TBD | TBD | TBD | TBD | TC-021 | デスクトップアプリ未実装 |
| FR-017 | TBD | TBD | TBD | TBD | TC-022 | Docker/Desktop挙動一致未実装 |
| FR-018 | web/app.js | function | renderNotifications | 手動確認 | TC-026, TC-027 | 通知描画 |
| FR-018 | web/app.js | function | updateNotificationBadge | 手動確認 | TC-026, TC-027 | 通知バッジ更新 |
| FR-018 | web/app.js | function | bindEvents | 手動確認 | TC-026, TC-027 | イベントバインド |
| FR-019 | web/app.js | function | createNextRecurringTodo | 手動確認 | TC-028, TC-029 | 繰り返しTodo生成 |
| FR-020 | TBD | TBD | TBD | TBD | TC-030, TC-031 | バックアップ未実装 |
| FR-021 | cmd/server/api.go | handler | handleProjects | internal/todo/store_test.go | TC-032, TC-033 | プロジェクトAPIハンドラ |
| FR-021 | cmd/server/api.go | handler | handleProjectByID | internal/todo/store_test.go | TC-033 | プロジェクト個別APIハンドラ |
| FR-021 | internal/todo/projects.go | function | CreateProject | internal/todo/store_test.go | TC-032 | プロジェクト作成処理 |
| FR-021 | internal/todo/projects.go | function | UpdateProject | internal/todo/store_test.go | TC-033 | プロジェクト更新処理 |
| FR-021 | internal/todo/projects.go | function | DeleteProject | internal/todo/store_test.go | TC-033 | プロジェクト削除処理 |
| FR-021 | internal/todo/projects.go | function | ListProjects | internal/todo/store_test.go | TC-032 | プロジェクト一覧取得 |
| FR-021 | web/app.js | function | loadProjects | 手動確認 | TC-032, TC-033 | プロジェクト読み込み |
| FR-021 | web/app.js | function | openProjectCreator | 手動確認 | TC-032 | プロジェクト作成UI表示 |
| FR-021 | web/app.js | function | syncProjectCreateAction | 手動確認 | TC-032 | 作成アクション同期 |
| FR-021 | web/app.js | function | submitProjectCreator | 手動確認 | TC-032 | プロジェクト作成送信 |
| FR-021 | web/app.js | function | submitProjectEditor | 手動確認 | TC-033 | プロジェクト編集送信 |
| FR-021 | web/app.js | function | deleteProject | 手動確認 | TC-033 | プロジェクト削除処理 |
| FR-021 | web/app.js | function | renderProjectManagementList | 手動確認 | TC-033 | プロジェクト管理一覧描画 |
| FR-022 | web/app.js | function | renderTodoView | 手動確認 | TC-041 | 期限切れビュー描画 |
| FR-022 | web/app.js | function | getVisibleTodos | 手動確認 | TC-041 | 期限切れフィルタ |
| FR-022 | web/app.js | function | isTodoVisibleOverdue | 手動確認 | TC-041 | 期限切れ判定 |
| FR-022 | web/app.js | function | renderTodoList | 手動確認 | TC-041 | 期限切れ一覧描画 |
| FR-023 | web/app.js | function | renderTodoView | 手動確認 | TC-042 | 完了ビュー描画 |
| FR-023 | web/app.js | function | getVisibleTodos | 手動確認 | TC-042 | 完了フィルタ |
| FR-023 | web/app.js | function | isTodoVisibleCompleted | 手動確認 | TC-042 | 完了判定 |
| FR-023 | web/app.js | function | renderTodoList | 手動確認 | TC-042 | 完了一覧描画 |
| FR-024 | web/app.js | function | renderTodoView | 手動確認 | TC-043 | 今後ビュー描画 |
| FR-024 | web/app.js | function | getVisibleTodos | 手動確認 | TC-043 | 今後フィルタ |
| FR-024 | web/app.js | function | isTodoVisibleUpcoming | 手動確認 | TC-043 | 今後判定 |
| FR-024 | web/app.js | function | isStartDateUpcoming | 手動確認 | TC-043 | 将来開始日判定 |
| FR-024 | web/app.js | function | renderTodoList | 手動確認 | TC-043 | 今後一覧描画 |
| NFR-001 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-090, TC-091, TC-092 | 応答時間計測対象 |
| NFR-001 | internal/todo/store.go | function | ListTodos | internal/todo/store_test.go | TC-090, TC-091 | 一覧取得性能 |
| NFR-002 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-093, TC-094, TC-095 | トランザクション保証 |
| NFR-002 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-093, TC-094 | トランザクション保証 |
| NFR-002 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-093, TC-094 | トランザクション保証 |
| NFR-003 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-096, TC-097 | サーバー側バリデーション |
| NFR-003 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-096, TC-097 | サーバー側バリデーション |
| NFR-003 | web/app.js | function | createTodo | 手動確認 | TC-098 | XSSエスケープ確認 |
| NFR-004 | TBD | TBD | TBD | TBD | TC-099, TC-100, TC-101 | デスクトップ未実装 |
| NFR-005 | TBD | TBD | TBD | TBD | TC-102, TC-103, TC-104 | デスクトップ未実装 |

## 実装完了条件

| 機能ID | 観測可能な結果 | テストID | 自動化 | 備考 |
|--------|----------------|----------|--------|------|
| FR-001 | title必須・description任意でPOST /api/todosが201を返しTodoが永続化される | TC-001 | yes | 単体テスト |
| FR-002 | PATCH /api/todos/{id}でタイトルとメモが更新され、編集ボタンからフォーム展開・スクロール・フォーカスが行われる | TC-002, TC-040 | yes/manual | 単体テスト+UI手動確認 |
| FR-003 | 削除確認ダイアログで確認後にDELETE /api/todos/{id}が実行され項目が消える。キャンセル時は項目が残る | TC-003, TC-034 | yes/manual | 単体テスト+UI手動確認 |
| FR-004 | 空タイトルで400エラー、121文字以上のタイトルで400エラーが返る | TC-004, TC-005 | yes | 単体テスト |
| FR-005 | 「すべて」タブで全Todoが新しい順に一覧表示され、デスクトップ幅では行型レイアウト、モバイル幅では縦積みカード表示になる | TC-006, TC-039, TC-045, TC-046 | yes/manual | 単体テスト+UI手動確認 |
| FR-006 | 詳細展開内の4状態セグメントコントロールからactive/in_progress/waiting/completed間で状態変更できる | TC-008, TC-009, TC-010, TC-011, TC-012, TC-038 | yes/manual | 単体テスト+UI手動確認 |
| FR-007 | GET /api/todos?status=active等で該当状態のTodoのみが返る | TC-007 | manual | UIフィルター未実装 |
| FR-008 | 「今日」タブでactive/in_progress/waitingかつstart_date到来済みまたは未設定のTodoのみ表示され、completedと未来start_dateは非表示 | TC-024, TC-025, TC-049, TC-105 | manual | UI手動確認 |
| FR-009 | 作成/編集フォームでstart_dateをJST日時で設定・更新・解除でき、時刻入力枠クリックでタイムピッカーが開く | TC-016, TC-044 | yes/manual | 単体テスト+UI手動確認 |
| FR-010 | due_dateをJST日時で設定でき、start_dateより前の値は拒否される。時刻入力枠クリックでタイムピッカーが開く | TC-013, TC-044, TC-106 | yes/manual | 単体テスト+UI手動確認 |
| FR-011 | Todoに担当者名を紐づけ・解除でき、一覧と詳細に反映される | TC-014 | yes/manual | 単体テスト+UI手動確認 |
| FR-012 | プロジェクトコンボボックスから検索・選択・解除でき、Todoに紐づくプロジェクトが保存される | TC-015 | yes/manual | 単体テスト+UI手動確認 |
| FR-013 | 親タスクを設定・解除でき、一覧と詳細の両方で親タスク名が表示される | TC-017 | yes/manual | 単体テスト+UI手動確認 |
| FR-014 | 自己参照・循環参照の親子設定が拒否され、親削除時に子のparent_todo_idがnullになる | TC-018, TC-019, TC-020 | yes | 単体テスト |
| FR-015 | 作成/更新/削除/状態変更がページ全体再読み込みなしで即時反映される。フォームの補助文・サマリ・モード別文言・折りたたみが仕様どおり動作する | TC-023, TC-035, TC-036, TC-037, TC-047, TC-048 | manual | UI手動確認 |
| FR-016 | デスクトップアプリ起動時にアプリケーションウィンドウ内で操作が完結する | TC-021 | no | 未実装 |
| FR-017 | Web UIとデスクトップUIで主要機能が同等に動作する | TC-022 | no | 未実装 |
| FR-018 | 通知設定の分前値変更が通知生成時刻に反映され、無効化時に通知が生成されない | TC-026, TC-027, TC-107, TC-108 | manual | UI手動確認 |
| FR-019 | daily/weekly/monthly設定タスクを完了すると次回Todoが1件自動生成され、次回日時が正しく計算される | TC-028, TC-029 | manual | UI手動確認 |
| FR-020 | エクスポートにTodo/担当者/プロジェクト/親子関係が含まれ、インポートで復元される | TC-030, TC-031 | no | 未実装 |
| FR-021 | ドロップダウン内で新規プロジェクトを作成すると候補に即時反映され、管理ダイアログで編集・削除するとTodo表示と候補に即時反映される | TC-032, TC-033 | yes/manual | 単体テスト+UI手動確認 |
| FR-022 | 「期限切れ」タブでdue_dateが現在日時より前かつ未完了のTodoのみ表示される | TC-041 | manual | UI手動確認 |
| FR-023 | 「完了」タブでcompleted状態のTodoのみ表示される | TC-042 | manual | UI手動確認 |
| FR-024 | 「今後」タブでstart_dateが現在日時より後の未完了Todoのみ表示される | TC-043 | manual | UI手動確認 |
| NFR-001 | Todo1000件以下で一覧/作成/更新/削除APIの95パーセンタイル応答時間が500ms未満 | TC-090, TC-091, TC-092 | no | 性能テスト未実装 |
| NFR-002 | すべてのサーバー側書き込み操作がトランザクション内で実行される | TC-093, TC-094, TC-095 | yes | コードレビューで確認 |
| NFR-003 | クライアント側検証の有無にかかわらずサーバー側で入力検証が行われる | TC-004, TC-005, TC-013, TC-096, TC-097, TC-098 | yes | 単体テスト |
| NFR-004 | デスクトップアプリのメインウィンドウ初回表示が3秒以内 | TC-099, TC-100, TC-101 | no | 未実装 |
| NFR-005 | Web UIとデスクトップUIで主要操作フローの操作回数差が1操作以内 | TC-102, TC-103, TC-104 | no | 未実装 |

## 非機能要件
- [ ] NFR-001: Todo件数1000件以下で、一覧/作成/更新/削除APIの95パーセンタイル応答時間を500ms未満とする。
- [x] NFR-002: すべてのサーバー側書き込み操作はトランザクションで実行する。
- [x] NFR-003: クライアント側検証があっても、サーバー側で入力検証を必ず行う。
- [ ] NFR-004: デスクトップアプリのメインウィンドウ初回表示を3秒以内とする。
- [ ] NFR-005: Web UIとデスクトップUIで主要操作フローの操作回数差を1操作以内に収める。

## データモデル

### Todo
| フィールド | 型 | 必須 | 説明 |
|------------|----|------|------|
| id | integer | yes | 主キー |
| title | text | yes | 最大120文字 |
| description | text | no | 任意の詳細 |
| status | text | yes | `active`、`in_progress`、`waiting`、`completed` |
| start_date | text | no | 開始予定日時。日付のみは`YYYY-MM-DD`、時刻付きはJST文字列で保持する |
| due_date | text | no | 締め切り日時。日付のみは`YYYY-MM-DD`、時刻付きはJST文字列で保持する |
| recurrence_rule | text | no | `none`、`daily`、`weekly`、`monthly` |
| assignee | text | no | 担当者名。現行実装ではTodoへ直接保持する |
| project_id | integer | no | 紐づくProjectのID。未所属Todoはnull |
| parent_todo_id | integer | no | 親Todoの`Todo.id`参照。ルートタスクはnull |
| created_at | datetime | yes | UTCタイムスタンプ |
| updated_at | datetime | yes | UTCタイムスタンプ |

### Project
| フィールド | 型 | 必須 | 説明 |
|------------|----|------|------|
| id | integer | yes | 主キー |
| name | text | yes | プロジェクト名。大小文字を区別せず一意 |
| created_at | datetime | yes | UTCタイムスタンプ |
| updated_at | datetime | yes | UTCタイムスタンプ |

### 時刻方針
- `start_date`はJST（UTC+09:00）で受け渡し・表示する。
- `due_date`はJST（UTC+09:00）で受け渡し・表示する。
- 通知スケジュール時刻（`notify_at`）はUTCで管理する。
- `created_at`と`updated_at`はUTCで保存・返却する。

### クライアント内 Notification
| フィールド | 型 | 必須 | 説明 |
|------------|----|------|------|
| key | text | yes | `start-<todo_id>`または`due-<todo_id>` |
| title | text | yes | 通知タイトル |
| time | text | yes | 表示用時刻文字列 |

### クライアント内 NotificationSetting
| フィールド | 型 | 必須 | 説明 |
|------------|----|------|------|
| start_reminder_minutes | integer | yes | 開始予定日の何分前に通知するか（例: 30） |
| due_reminder_minutes | integer | yes | 締め切り日の何分前に通知するか（例: 60） |
| enabled | boolean | yes | 通知の有効/無効 |
| persisted | boolean | yes | 現行実装では`false`。リロードで既定値へ戻る |

## API仕様

### 現在実装されているAPI

### POST /api/todos
Todoを作成する。

リクエスト:
```json
{
  "title": "牛乳を買う",
  "description": "2リットル",
  "status": "active",
  "start_date": "2026-03-08T09:00",
  "due_date": "2026-03-10T09:00",
  "recurrence_rule": "weekly",
  "assignee": "Mika",
  "project_id": 3,
  "parent_todo_id": null
}
```

レスポンス 201:
```json
{
  "id": 1,
  "title": "牛乳を買う",
  "description": "2リットル",
  "status": "active",
  "start_date": "2026-03-08T09:00",
  "due_date": "2026-03-10T09:00",
  "recurrence_rule": "weekly",
  "assignee": "Mika",
  "project_id": 3,
  "project": {
    "id": 3,
    "name": "買い出し",
    "created_at": "2026-03-14T00:00:00Z",
    "updated_at": "2026-03-14T00:00:00Z"
  },
  "parent_todo_id": null,
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

### GET /api/todos?status=all|active|in_progress|waiting|completed[&q=keyword]
Todo一覧を返す。現行UIではクエリなしで全Todoを取得し、クライアント側のタブ切り替えで`今日`、`今後`、`期限切れ`、`完了`、`すべて`を表示する。`今日`はJST基準で`active`/`in_progress`/`waiting`かつ開始予定日時到来済み、または`start_date`未設定のTodoを対象とする。`今後`はJST基準で`active`/`in_progress`/`waiting`かつ`start_date`が現在日時より後のTodoを対象とする。`期限切れ`はJST基準で`due_date`が現在日時より前、かつ`completed`以外のTodoを対象とする。`完了`は`completed`状態のみを対象とする。`status`は任意で、指定時は該当状態のみ返す。`q`は互換用途として継続対応しており、指定時はタイトル、説明、担当者、プロジェクト名に対する部分一致検索を行う。

### PATCH /api/todos/{id}
タイトル、説明、状態、開始予定日、締め切り、担当者、プロジェクト、繰り返し、親子関係を部分更新する。

### DELETE /api/todos/{id}
Todoを削除する。

### GET /api/projects
登録済みプロジェクトを返す。レスポンスはプロジェクト名昇順とする。

### POST /api/projects
プロジェクトを作成する。

リクエスト:
```json
{
  "name": "営業改善"
}
```

レスポンス 201:
```json
{
  "id": 1,
  "name": "営業改善",
  "created_at": "2026-03-14T00:00:00Z",
  "updated_at": "2026-03-14T00:00:00Z"
}
```

### PATCH /api/projects/{id}
プロジェクト名を更新する。Todoは`project_id`参照を維持したまま、以後の一覧表示とフォーム候補へ新しい名称を反映する。

### DELETE /api/projects/{id}
プロジェクトを削除する。削除時は、そのプロジェクトに紐づくTodoの`project_id`を`null`へ更新する。

### 未実装のAPI
- `GET /api/notifications`
- `POST /api/notifications/{id}/read`
- `GET /api/notification-settings`
- `PATCH /api/notification-settings`
- `GET /api/backup/export`
- `POST /api/backup/import`
- `GET /api/assignees`
- `POST /api/assignees`

## 画面仕様

### 共通メイン画面構成（Web/デスクトップ）
- ヘッダー: アプリタイトル、通知ベル（表示対象件数バッジ付き。クリックで右上ポップオーバー表示）、通知設定ボタン
- Todo入力エリア: 作成フォームは折りたたみ可能とし、閉じた状態でも「新しいTodoを追加」の見出し、補助文、必要に応じて入力途中バッジと下書きサマリを表示する。開いた状態の主要構成はタイトル、メモ、プロジェクト、締切、操作ボタンで、追加モードでは`キャンセル/追加する`、編集モードでは`編集をキャンセル/更新する`を表示する。キャンセル操作では入力を破棄してフォームを折りたたむ。タイトル欄のプレースホルダは入力例を示し、文字数制限は入力欄のカウンタで把握できるようにする。メモ欄は`メモ（任意）`ラベルと入力例プレースホルダを使い、詳細表示側の見出しも`メモ`に統一する。Todo一覧の編集ボタンから編集開始した場合はフォームを開いてその位置までスクロールし、タイトル入力へフォーカスする。新規追加成功後はフォームを開いたまま維持し、詳細設定の開閉状態も維持する。編集更新成功後はフォームを折りたたむ。プロジェクト欄は検索付き単一選択コンボボックスUIとし、閉じた状態ではフォルダアイコン、選択済みプロジェクト名または`プロジェクトなし`、開閉アイコンを表示する。クリックで開いたドロップダウン内には検索入力、候補一覧、補助アクション（`+ 新しいプロジェクトを作成` / `プロジェクトを管理`）を配置し、新規作成は下部の小型UIで`作成` / `キャンセル`操作できるようにする。締切と開始予定はそれぞれ`日付`と`時刻`を持つ日時グループとしてまとめ、`日本時間`の案内は各グループ見出しの控えめな補助テキストで示す。詳細設定（折りたたみ）には開始予定、担当者、繰り返し、親タスクを配置する。日付入力欄はカレンダーアイコン付きで、クリック時にカレンダーポップオーバーを開いて日付選択し、表示形式は`YYYY/MM/DD`とする。時刻入力欄は時計アイコン付きの入力UIとし、入力枠内の任意箇所をクリックするとネイティブタイムピッカーを開けるようにする。日付欄のキーボード直接入力は許可しない
- Todo一覧エリア: 上部に独立したタブ列（`今日` / `今後` / `期限切れ` / `完了` / `すべて`）を配置し、その下に現在ビューの見出し、件数、補助文を表示する。`今日`ではJST基準で未完了かつ開始予定日時が到来したTodoだけを表示し、`completed`は除外する。`start_date`未設定Todoは即着手可能として含める。`今後`ではJST基準で未完了かつ`start_date`が現在日時より後のTodoを表示する。`start_date`未設定Todoは含めない。`期限切れ`ではJST基準で`due_date`が現在日時より前、かつ未完了のTodoを表示する。`完了`では`completed`状態のみを表示する。`すべて`では状態や開始予定日時に関係なく全件を表示する。デスクトップ幅では一覧を行ベースのテーブル風レイアウトとし、固定ヘッダー行は表示しない。列は`タイトル`、`プロジェクト/親タスク`、`期限`、`ステータス`、`操作`を基本とする。タイトルを最も強く表示し、補助情報は控えめにする。各行ではタイトル、プロジェクト名、親タスク名、期限、状態を1行で俯瞰できるようにし、説明文、開始予定日、担当者、繰り返し、詳細な状態変更UI、編集操作は詳細展開内へ収める。ステータス列は状態ラベルの文字数に関係なく左位置が揃う固定幅とし、展開Chevronは列の右端に揃える。詳細展開は行本体のクリック、またはフォーカス後の`Enter`/`Space`で開閉できるようにする。親タスクが設定されている場合は、一覧と詳細表示の両方で親タスク名を表示する。削除は常時表示せず三点メニュー内に配置し、削除前には確認ダイアログを表示する。モバイル幅では各項目を縦積みカードへ崩して`タイトル`、`期限`、`ステータス`、`操作`を優先表示する
- プロジェクト管理ダイアログ: プロジェクトドロップダウン下部の補助導線からモーダル表示し、プロジェクト名入力、保存ボタン、既存プロジェクト一覧、各プロジェクトの編集/削除ボタンを提供する

### モード別UI要件
| モード | 表示先 | 補足 |
|-------|-------|------|
| Docker | ブラウザUI | `http://<host>:<port>/`でアクセス |
| Desktop | 未実装 | 将来的にアプリケーションウィンドウを表示し、外部ブラウザ不要で操作できるようにする |

### ユーザーフロー（Docker）
1. ユーザーがブラウザで`/`を開く。
2. 既存Todoと登録済みプロジェクトが読み込まれる。
3. 必要に応じてTodoフォームのプロジェクト欄を開き、ドロップダウン内の検索入力で候補を絞り込む。候補0件時は下部の`+ 新しいプロジェクトを作成`からそのまま作成できる。
4. 作成・編集フォームでは既存プロジェクトを0または1件選択してTodoへ設定し、`プロジェクトなし`のままでも保存できる。`プロジェクトを管理`からは一覧表示、名称変更、削除を行える。
5. ユーザーが作成・編集・状態変更・削除を行う。
6. 開始予定日/締め切りに応じた通知がベル押下時の右上ポップオーバーに表示される。
7. UIは即時更新され、再読み込み後も状態が保持される。

### ユーザーフロー（Desktop）
1. 現行実装では未提供。
2. デスクトップアプリモード実装時に、アプリケーションウィンドウ内でSPEC-001の主要操作を提供する予定。

## テスト仕様
### グループA: 基本CRUDと入力検証
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-001 | FR-001 | 正常なタイトルでTodoを作成できる | 正常系 |
| TC-002 | FR-002 | タイトルとメモを更新できる | 正常系 |
| TC-003 | FR-003 | 削除確認を経て削除すると項目が残らない | 正常系 |
| TC-004 | FR-004 | 空タイトルを拒否する | 異常系 |
| TC-005 | FR-004 | タイトル121文字以上を拒否する | 境界値 |
| TC-050 | FR-001 | titleがnullまたは空文字のリクエストでTodo作成が拒否される | 異常系 |
| TC-051 | FR-001 | titleが1文字のTodoを作成できる | 境界値 |
| TC-052 | FR-002 | 存在しないTodo IDへの更新リクエストが404を返す | 異常系 |
| TC-053 | FR-002 | titleを120文字ちょうどに更新できる | 境界値 |
| TC-054 | FR-003 | 存在しないTodo IDへの削除リクエストが404を返す | 異常系 |
| TC-055 | FR-003 | 作成直後のTodoを即座に削除できる | 境界値 |

### グループB: 一覧・絞り込み・状態遷移
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-006 | FR-005 | `すべてのTodo`表示で一覧が新しい順に表示される | 正常系 |
| TC-007 | FR-007 | active/in_progress/waiting/completed/allで絞り込める | 正常系 |
| TC-008 | FR-006 | activeからin_progressへ切り替えできる | 正常系 |
| TC-009 | FR-006 | in_progressからwaitingへ切り替えできる | 正常系 |
| TC-010 | FR-006 | in_progressからcompletedへ切り替えできる | 正常系 |
| TC-011 | FR-006 | waitingからin_progressへ切り替えできる | 正常系 |
| TC-012 | FR-006 | waitingからcompletedへ切り替えできる | 正常系 |
| TC-038 | FR-006 | 各Todoの詳細展開内で状態変更UIが4状態の1行セグメントコントロールとして表示され、一覧行では状態バッジのみが主表示になる | UI結合テスト |
| TC-039 | FR-005 | 狭幅画面では一覧ヘッダー行を省略し、各Todoが`タイトル`、`期限`、`ステータス`、`操作`を優先した縦積みカード表示へ崩れる | UI結合テスト |
| TC-045 | FR-005 | 一覧行の本文クリック、またはフォーカス後の`Enter`/`Space`で詳細を開閉できる | UI結合テスト |
| TC-046 | FR-005 | ステータスが`待ち`や`完了`でも、デスクトップ一覧で`プロジェクト/親タスク`、`期限`、`ステータス`列の左位置が揃う | UI結合テスト |
| TC-056 | FR-005 | Todo件数0件のとき一覧が空状態メッセージを表示する | 境界値 |
| TC-057 | FR-005 | 不正なビュー名を指定した場合にデフォルトビューへフォールバックする | 異常系 |
| TC-058 | FR-006 | 不正な状態値への変更リクエストが拒否される | 異常系 |
| TC-059 | FR-006 | completedからactiveへ状態を戻せる | 境界値 |
| TC-060 | FR-007 | 存在しない状態値で絞り込むと空の結果が返る | 異常系 |
| TC-061 | FR-007 | 全状態が混在する一覧からcompletedのみを正しく絞り込める | 境界値 |
| TC-062 | FR-008 | start_dateがJST現在日時ちょうどのTodoが表示対象に含まれる | 境界値 |
| TC-105 | FR-008 | start_dateに不正な形式の値が設定されたTodoがあっても今日タブが正常に表示される | 異常系 |
| TC-063 | FR-022 | due_date未設定のTodoは期限切れタブに表示されない | 異常系 |
| TC-064 | FR-022 | due_dateがJST現在日時ちょうどのTodoの表示判定が正しい | 境界値 |
| TC-065 | FR-023 | completed以外の状態のTodoが完了タブに表示されない | 異常系 |
| TC-066 | FR-023 | completed直後のTodoが完了タブに即座に反映される | 境界値 |
| TC-067 | FR-024 | start_date未設定のTodoが今後タブに表示されない | 異常系 |
| TC-068 | FR-024 | start_dateがJST現在日時の1秒後のTodoが今後タブに表示される | 境界値 |

### グループC: 属性管理（開始予定日・締め切り・担当者・プロジェクト）
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-013 | FR-010 | `start_date`設定時、`due_date`は`start_date`以降のみ許可し、`start_date`より前は拒否する（JST） | 異常系 |
| TC-014 | FR-011 | Todoに担当者を紐づけ・解除できる | 正常系 |
| TC-015 | FR-012 | ドロップダウン検索から事前作成したプロジェクトを1件選択してTodoへ紐づけ・解除できる | 正常系 |
| TC-016 | FR-009 | start_dateをJST（UTC+09:00）で設定・更新・解除できる | 正常系 |
| TC-044 | FR-009, FR-010 | 開始時刻/締切時刻の入力枠内をクリックすると、時計アイコン以外からでもネイティブタイムピッカーを開ける | UI結合テスト |
| TC-106 | FR-010 | due_dateをJST日時で正常に設定・更新・解除できる | 正常系 |
| TC-069 | FR-009 | 不正な日時形式のstart_dateが拒否される | 異常系 |
| TC-070 | FR-009 | start_dateを設定後に解除（null）できる | 境界値 |
| TC-071 | FR-010 | due_dateをstart_dateと同日時ちょうどに設定できる | 境界値 |
| TC-072 | FR-010 | 不正な日時形式のdue_dateが拒否される | 異常系 |
| TC-073 | FR-011 | 担当者を設定後に空文字で解除できる | 境界値 |
| TC-074 | FR-011 | 存在しないTodo IDへの担当者設定が404を返す | 異常系 |
| TC-075 | FR-012 | 存在しないproject_idを指定した場合にエラーが返る | 異常系 |
| TC-076 | FR-012 | プロジェクト紐づけを解除（null）して保存できる | 境界値 |

### グループD: 親子タスク管理
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-017 | FR-013 | 親タスクを設定・解除でき、一覧と詳細表示の両方で親タスク名が表示される | 正常系 |
| TC-018 | FR-014 | 自己参照の親子設定を拒否する | 異常系 |
| TC-019 | FR-014 | 循環参照となる親子設定を拒否する | 異常系 |
| TC-020 | FR-014 | 親タスク削除時に子タスクの`parent_todo_id`が`null`になる | 結合テスト |
| TC-077 | FR-013 | 存在しないTodo IDを親に指定するとエラーが返る | 異常系 |
| TC-078 | FR-013 | 子Todoが1件だけの最小親子構成を作成できる | 境界値 |

### グループE: クライアントUIモード
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-021 | FR-016 | デスクトップアプリ起動時に外部ブラウザ不要で操作できる | 結合テスト |
| TC-022 | FR-017 | Web UIとデスクトップUIで主要機能が同等に動作する | 比較テスト |
| TC-023 | FR-015 | 作成/更新/削除/状態変更がページ全体再読み込みなしで反映される | 結合テスト |
| TC-034 | FR-003 | 削除確認ダイアログでキャンセルした場合は項目が残る | 異常系 |
| TC-035 | FR-015 | 作成フォームを閉じた状態でも補助文と入力途中サマリが表示される | UI結合テスト |
| TC-036 | FR-015 | 追加モード/編集モードそれぞれで適切なボタン文言が表示され、キャンセルでフォームが折りたたまれる | UI結合テスト |
| TC-037 | FR-015 | 新規追加成功後はフォームが開いたままで詳細設定の開閉状態が維持され、編集更新成功後はフォームが折りたたまれる | UI結合テスト |
| TC-040 | FR-002 | 一覧の編集ボタンを押すと編集フォームが開き、その位置までスクロールしてタイトル入力へフォーカスする | UI結合テスト |
| TC-047 | FR-001, FR-002 | 作成/編集フォームでタイトル欄は入力例プレースホルダを表示し、文字数制限は入力欄のカウンタで分かる。メモ欄は`メモ（任意）`ラベルと入力例プレースホルダを表示する | UI結合テスト |
| TC-048 | FR-009, FR-010, FR-015 | 締切/開始予定は各グループ内に`日付`と`時刻`としてまとまり、日本時間案内は見出し横の控えめな補助テキストで表示される | UI結合テスト |
| TC-079 | FR-015 | ネットワークエラー時にUI上でエラーメッセージが表示される | 異常系 |
| TC-080 | FR-015 | 高速連続操作（作成→即削除）で状態が正しく同期される | 境界値 |
| TC-081 | FR-016 | デスクトップアプリが外部ブラウザを起動しない | 境界値 |
| TC-082 | FR-017 | Web UIとデスクトップUIの主要操作で結果が一致する | 境界値 |
| TC-083 | FR-017 | 片方のモードだけに存在する機能がないことを確認する | 異常系 |

### グループF: 当日表示・通知・繰り返し・バックアップ
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-024 | FR-008 | `active`/`in_progress`/`waiting`で、`start_date`未設定またはJST現在日時以前のTodoが一覧表示される | 正常系 |
| TC-025 | FR-008 | `completed`のTodoと、`start_date`がJST現在日時より未来のTodoは一覧表示されない | 正常系 |
| TC-049 | FR-005, FR-008, FR-022, FR-023, FR-024 | 一覧タブで`今日`、`今後`、`期限切れ`、`完了`、`すべて`を往復でき、それぞれ件数と空状態文言が切り替わる | UI結合テスト |
| TC-041 | FR-022 | `due_date`がJST現在日時より前で、`completed`以外のTodoだけが`期限切れ`タブに表示される | 正常系 |
| TC-042 | FR-023 | `completed`状態のTodoだけが`完了`タブに表示される | 正常系 |
| TC-043 | FR-024 | `active`/`in_progress`/`waiting`で、`start_date`がJST現在日時より後のTodoだけが`今後`タブに表示される | 正常系 |
| TC-026 | FR-018 | 通知設定（開始予定日/締め切りの分前）変更が通知生成時刻に反映される | 結合テスト |
| TC-027 | FR-018 | 通知設定で通知を無効化した場合に通知が生成されない | 結合テスト |
| TC-028 | FR-019 | `daily`設定タスクを完了すると次回タスクが1件自動生成される | 結合テスト |
| TC-029 | FR-019 | `weekly`/`monthly`設定で次回日時が正しく計算される | 境界値 |
| TC-030 | FR-020 | バックアップエクスポートにTodo/担当者/プロジェクト/親子関係が含まれる | 正常系 |
| TC-031 | FR-020 | バックアップインポートでデータが復元される | 結合テスト |
| TC-032 | FR-021 | ドロップダウン内の`+ 新しいプロジェクトを作成`でプロジェクトを作成すると、その場で候補へ反映され自動選択される | 結合テスト |
| TC-033 | FR-021 | プロジェクト管理ダイアログでプロジェクトを編集・削除すると、既存Todo表示と選択候補へ即時反映される | 結合テスト |
| TC-107 | FR-018 | 開始予定日/締め切りの設定分前どおりに通知が生成される | 正常系 |
| TC-108 | FR-018 | 通知分前値に負数を設定した場合に通知が生成されない | 異常系 |
| TC-084 | FR-018 | 通知分前を0に設定した場合の挙動が正しい | 境界値 |
| TC-085 | FR-019 | recurrence_ruleがnone設定のタスクを完了しても次回タスクが生成されない | 異常系 |
| TC-086 | FR-020 | 不正なフォーマットのインポートファイルがエラーを返す | 異常系 |
| TC-087 | FR-020 | Todo件数0件のエクスポートが空でない有効なファイルを生成する | 境界値 |
| TC-088 | FR-021 | 重複するプロジェクト名での作成が拒否される | 異常系 |
| TC-089 | FR-021 | プロジェクト名を1文字で作成できる | 境界値 |

### 非機能要件
| テストID | 対応要件 | テスト内容 | 種別 |
|---------|---------|-----------|------|
| TC-090 | NFR-001 | Todo1000件でCRUD APIの95パーセンタイル応答時間が500ms未満である | 正常系 |
| TC-091 | NFR-001 | Todo1001件目の作成時にも応答時間が著しく劣化しない | 境界値 |
| TC-092 | NFR-001 | 大量の同時リクエスト時にタイムアウトやエラーが発生しない | 異常系 |
| TC-093 | NFR-002 | 書き込み中にプロセスが停止してもデータ不整合が発生しない | 正常系 |
| TC-094 | NFR-002 | 同時書き込みでデッドロックが発生しない | 異常系 |
| TC-095 | NFR-002 | 1件の書き込みのみの場合もトランザクション内で実行される | 境界値 |
| TC-096 | NFR-003 | 空タイトルや不正文字列をサーバー側で拒否する | 正常系 |
| TC-097 | NFR-003 | SQLインジェクション文字列を含む入力が安全に処理される | 異常系 |
| TC-098 | NFR-003 | XSS攻撃文字列を含む入力がエスケープされて表示される | 境界値 |
| TC-099 | NFR-004 | デスクトップアプリのメインウィンドウが3秒以内に表示される | 正常系 |
| TC-100 | NFR-004 | 大量データ存在時でも初回表示が3秒以内に収まる | 境界値 |
| TC-101 | NFR-004 | デスクトップアプリが起動失敗時にエラーダイアログを表示する | 異常系 |
| TC-102 | NFR-005 | Web UIとデスクトップUIの主要操作フローの操作回数差が1以内である | 正常系 |
| TC-103 | NFR-005 | 操作回数が最も多い機能で差が1操作以内に収まる | 境界値 |
| TC-104 | NFR-005 | 片方のモードで追加操作が必要な場合にその差が1操作以内である | 異常系 |

## 依存関係
| 依存先 | 種別 | 説明 |
|--------|------|------|
| SPEC-002 | 内部 | 実行形態要件がホスティングとデータパスに影響する |
| sqlite3 driver | 外部 | 永続化レイヤー |
| デスクトップUIランタイム | 外部 | アプリケーションウィンドウ提供（例: Wails） |
| 通知API（Web/Desktop） | 外部 | 通知表示機能（ブラウザ通知またはデスクトップ通知） |

## 判断記録
| 日付 | 判断内容 | 理由 |
|------|---------|------|
| 2026-03-07 | サーバー配信HTMLまたはvanilla-js UIで開始する | デスクトップとDockerの挙動を低複雑度で一致させるため |
| 2026-03-07 | デスクトップ利用時はブラウザではなく専用ウィンドウUIを採用する | インストールアプリとしての操作体験を優先するため |
| 2026-03-07 | Todo状態を4値（active/in_progress/waiting/completed）に拡張する | 実運用でのタスク進捗をより正確に表現するため |
| 2026-03-07 | Todoに締め切り、担当者、プロジェクト、親子関係を追加する | 計画管理とタスク分解を実運用レベルで扱えるようにするため |
| 2026-03-07 | due_dateの基準時刻を日本時刻（JST）に統一する | ユーザー運用のタイムゾーン要件を満たすため |
| 2026-03-08 | Todoに開始予定日（start_date）を追加する | 着手計画を締め切りと分けて管理できるようにするため |
| 2026-03-08 | 検索・通知・繰り返し・バックアップ機能をMVP要件へ追加する | 個人運用での実利用性と継続運用性を高めるため |
| 2026-03-08 | start_date/due_dateの整合チェック、親削除時の子親解除、通知設定変更をMVP要件に含める | タスク整合性と運用時の使い勝手を担保するため |
| 2026-03-14 | Todoの書き込みはサーバーAPI経由でSQLiteへ保存する | リロードや再起動後も状態を保持し、サーバー側検証を一元化するため |
| 2026-03-14 | 作成フォームの折りたたみ見出しに補助文と入力途中サマリを表示し、一覧の状態変更は1クリック操作へ変更する | 閉じた状態でも作成入口と現在の入力状況を把握しやすくし、日常操作の負荷を下げるため |
| 2026-03-15 | プロジェクト操作は検索付きコンボボックスのドロップダウン内へ集約し、新規作成は下部の小型UIで行う | 選択、検索、新規作成を1つの文脈に統一し、重い独立フォーム感を避けるため |
| 2026-03-15 | Todoカードの現在状態は右上バッジに集約し、下部の状態変更UIはPC/狭幅画面とも軽い1行セグメントコントロールを基本とする | 状態表示と状態変更の役割を分離しつつ、カード高さと情報密度を両立するため |
| 2026-03-20 | 一覧ヘッダーの検索UIを廃止し、`今日やるTodo`と`すべてのTodo`を切り替えるビューUIへ置き換える。`start_date`未設定Todoは即着手可能として含める | 個人運用では名前検索より、当日の着手対象確認と全件確認を素早く往復できることを優先するため |
| 2026-03-20 | Todo一覧は4タブ構成とし、デスクトップではカードUIより行ベース一覧を優先する。状態変更は詳細展開内へ寄せ、削除は三点メニューへ移す | 大量のTodoを素早く見比べる一覧性を優先し、タイトル・期限・状態の視認性と危険操作の安全性を両立するため |
| 2026-03-20 | Todo一覧から編集開始したときは、編集フォーム位置まで自動スクロールしてタイトル入力へフォーカスする | 長い一覧でも編集対象の入力位置へ迷わず移動できるようにするため |
| 2026-03-20 | `今日`と対になる`今後`タブを追加し、未来の`start_date`を持つ未完了Todoを分離表示する | 翌日以降に着手予定のタスクを、当日対応タスクと混ぜずに見通せるようにするため |
| 2026-03-21 | 時刻入力は時計アイコン押下だけに依存せず、入力枠のクリックでもネイティブタイムピッカーを開けるようにする | 日付入力と同じ感覚で操作でき、時刻設定の見つけにくさを減らすため |

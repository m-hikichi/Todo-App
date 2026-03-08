# トレーサビリティマトリクス

## 凡例
- ✅ 実装済み・整合確認済み
- 🔧 実装中
- ⚠️ 仕様更新済み・コード未反映
- ❌ 未実装

| 要件ID | 仕様ID | 機能ID(FR) | 実装ファイル | 関数/クラス | テストファイル | ステータス |
|--------|--------|------------|--------------|------------|----------------|-----------|
| FC-01-01-001 | SPEC-001 | FR-001 | web/index.html, web/app.js | createTodo | 手動確認（タイトル必須/説明任意で追加） | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | TBD | TBD | TBD | ❌ |
| FC-01-01-003 | SPEC-001 | FR-003 | web/index.html, web/app.js | deleteTodo | 手動確認（削除ボタンで一覧から消える） | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | web/app.js | createTodo | 手動確認（空タイトル/121文字以上を拒否） | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | web/app.js | createTodo, renderTodoList | 手動確認（新規Todoが先頭表示） | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | web/index.html, web/app.js | bindEvents, renderStatusOptions | 手動確認（active/in_progress/waiting/completed遷移） | ✅ |
| FC-01-03-002 | SPEC-001 | FR-007 | TBD | TBD | TBD | ❌ |
| FC-01-02-002 | SPEC-001 | FR-008 | TBD | TBD | TBD | ❌ |
| FC-02-01-002 | SPEC-001 | FR-009 | web/index.html, web/app.js | toggleCalendarPopover, applyCalendarDate, clearCalendarDate, combineDateAndTime | 手動確認（開始予定日/時刻の入力UIは実装済み） | 🔧 |
| FC-02-01-001 | SPEC-001 | FR-010 | web/index.html, web/app.js | combineDateAndTime, isValidStartDue | 手動確認（締切入力と開始日以降バリデーション） | 🔧 |
| FC-02-02-001 | SPEC-001 | FR-011 | web/index.html, web/app.js | createTodo, renderTodoList | 手動確認（担当者の紐づけ表示は実装済み） | 🔧 |
| FC-02-03-001 | SPEC-001 | FR-012 | web/index.html, web/app.js | createTodo, renderTodoList | 手動確認（ラベル複数入力・表示は実装済み） | 🔧 |
| FC-03-01-001 | SPEC-001 | FR-013 | web/index.html, web/app.js | createTodo, renderParentOptions, renderTodoList | 手動確認（親タスク設定と表示は実装済み） | 🔧 |
| FC-03-01-002 | SPEC-001 | FR-014 | web/app.js | deleteTodo | 手動確認（親削除時の子親解除のみ実装） | 🔧 |
| FC-05-01-001 | SPEC-001 | FR-015 | web/app.js | createTodo, deleteTodo, render | 手動確認（全体リロードなしで再描画） | ✅ |
| FC-04-02-002 | SPEC-001 | FR-016 | TBD | TBD | TBD | ❌ |
| FC-04-06-001 | SPEC-001 | FR-017 | TBD | TBD | TBD | ❌ |
| FC-05-02-001 | SPEC-001 | FR-018 | web/index.html, web/app.js, web/styles.css | renderNotifications, updateNotificationBadge, bindEvents | 手動確認（通知設定反映・ベル押下でポップオーバー表示） | ✅ |
| FC-06-01-001 | SPEC-001 | FR-019 | web/index.html, web/app.js | createNextRecurringTodo | 手動確認（繰り返しTodo完了時に次回生成） | ✅ |
| FC-04-07-001 | SPEC-001 | FR-020 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-001 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（Docker実行モードで起動） | 🔧 |
| FC-04-02-002 | SPEC-002 | FR-001 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-002 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（docker compose up --build） | ✅ |
| FC-04-01-001 | SPEC-002 | FR-003 | TBD | TBD | TBD | ❌ |
| FC-04-05-001 | SPEC-002 | FR-004 | TBD | TBD | TBD | ❌ |
| FC-04-05-002 | SPEC-002 | FR-005 | TBD | TBD | TBD | ❌ |
| FC-04-02-002 | SPEC-002 | FR-006 | TBD | TBD | TBD | ❌ |
| FC-04-03-001 | SPEC-002 | FR-007 | cmd/server/main.go | main | 手動確認（GET /healthz） | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | cmd/server/main.go, compose.yaml | envOrDefault, main | 手動確認（host/portの環境変数設定は実装済み） | 🔧 |
| FC-04-06-001 | SPEC-002 | FR-009 | TBD | TBD | TBD | ❌ |

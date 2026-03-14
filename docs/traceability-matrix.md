# トレーサビリティマトリクス

## 凡例
- ✅ 実装済み・整合確認済み
- 🔧 実装中
- ⚠️ 仕様更新済み・コード未反映
- ❌ 未実装

| 要件ID | 仕様ID | 機能ID(FR) | 実装ファイル | 関数/クラス | テストファイル | ステータス |
|--------|--------|------------|--------------|------------|----------------|-----------|
| FC-01-01-001 | SPEC-001 | FR-001 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, createTodo | internal/todo/store_test.go | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | TBD | TBD | TBD | ❌ |
| FC-01-01-003 | SPEC-001 | FR-003 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodoByID, DeleteTodo, deleteTodo | internal/todo/store_test.go | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, createTodo | internal/todo/store_test.go | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, ListTodos, loadTodos, renderTodoList | internal/todo/store_test.go | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodoByID, UpdateTodo, patchTodo, renderStatusOptions | internal/todo/store_test.go | ✅ |
| FC-01-03-002 | SPEC-001 | FR-007 | TBD | TBD | TBD | ❌ |
| FC-01-02-002 | SPEC-001 | FR-008 | TBD | TBD | TBD | ❌ |
| FC-02-01-002 | SPEC-001 | FR-009 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, validateTodoValues, combineDateAndTime | internal/todo/store_test.go | 🔧 |
| FC-02-01-001 | SPEC-001 | FR-010 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, validateTodoValues, isValidStartDue | internal/todo/store_test.go | 🔧 |
| FC-02-02-001 | SPEC-001 | FR-011 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, renderTodoList | internal/todo/store_test.go | 🔧 |
| FC-02-03-001 | SPEC-001 | FR-012 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, renderTodoList | internal/todo/store_test.go | 🔧 |
| FC-03-01-001 | SPEC-001 | FR-013 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, renderParentOptions, renderTodoList | internal/todo/store_test.go | 🔧 |
| FC-03-01-002 | SPEC-001 | FR-014 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodoByID, UpdateTodo, validateParentReference, deleteTodo | internal/todo/store_test.go | 🔧 |
| FC-05-01-001 | SPEC-001 | FR-015 | web/app.js | createTodo, deleteTodo, render | 手動確認（全体リロードなしで再描画） | ✅ |
| FC-04-02-002 | SPEC-001 | FR-016 | TBD | TBD | TBD | ❌ |
| FC-04-06-001 | SPEC-001 | FR-017 | TBD | TBD | TBD | ❌ |
| FC-05-02-001 | SPEC-001 | FR-018 | web/index.html, web/app.js, web/styles.css | renderNotifications, updateNotificationBadge, bindEvents | 手動確認（通知設定反映・ベル押下でポップオーバー表示） | ✅ |
| FC-06-01-001 | SPEC-001 | FR-019 | web/index.html, web/app.js | createNextRecurringTodo | 手動確認（繰り返しTodo完了時に次回生成） | ✅ |
| FC-04-07-001 | SPEC-001 | FR-020 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-001 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（Docker実行モードで起動） | 🔧 |
| FC-04-02-002 | SPEC-002 | FR-001 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-002 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（docker compose up --build） | ✅ |
| FC-04-01-001 | SPEC-002 | FR-003 | cmd/server/main.go, cmd/server/api.go, internal/todo/store.go, web/app.js, Dockerfile, compose.yaml | main, handleTodos, CreateTodo, ListTodos, DeleteTodo, loadTodos | internal/todo/store_test.go | 🔧 |
| FC-04-05-001 | SPEC-002 | FR-004 | TBD | TBD | TBD | ❌ |
| FC-04-05-002 | SPEC-002 | FR-005 | TBD | TBD | TBD | ❌ |
| FC-04-02-002 | SPEC-002 | FR-006 | TBD | TBD | TBD | ❌ |
| FC-04-03-001 | SPEC-002 | FR-007 | cmd/server/main.go | main | 手動確認（GET /healthz） | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | cmd/server/main.go, Dockerfile, compose.yaml, README.md | envOrDefault, main | README手順と設定値で確認 | ✅ |
| FC-04-06-001 | SPEC-002 | FR-009 | TBD | TBD | TBD | ❌ |

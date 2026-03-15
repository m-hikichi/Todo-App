# トレーサビリティマトリクス

## 凡例
- ✅ 実装済み・整合確認済み
- 🔧 実装中
- ⚠️ 仕様更新済み・コード未反映
- ❌ 未実装

| 要件ID | 仕様ID | 機能ID(FR) | 実装ファイル | 関数/クラス | テストファイル | ステータス |
|--------|--------|------------|--------------|------------|----------------|-----------|
| FC-01-01-001 | SPEC-001 | FR-001 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, createTodo | internal/todo/store_test.go | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodoByID, UpdateTodo, submitTodoForm, updateTodo, beginEditing | internal/todo/store_test.go, 手動確認（一覧の編集ボタンから保存） | ✅ |
| FC-01-01-003 | SPEC-001 | FR-003 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodoByID, DeleteTodo, deleteTodo, promptDeleteTodo, confirmDeleteTodo | internal/todo/store_test.go, 手動確認（削除確認ダイアログの表示とキャンセル） | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, CreateTodo, createTodo | internal/todo/store_test.go | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodos, ListTodos, loadTodos, renderTodoList | internal/todo/store_test.go | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | cmd/server/api.go, internal/todo/store.go, web/app.js, web/styles.css | handleTodoByID, UpdateTodo, patchTodo, setTodoStatus, renderTodoList, renderStatusButtons, getStatusText | internal/todo/store_test.go, 手動確認（PC/スマホ幅とも1行セグメント表示。狭幅では必要時のみ横スクロールして1操作で状態変更） | ✅ |
| FC-01-03-002 | SPEC-001 | FR-007 | cmd/server/api.go, internal/todo/store.go | handleTodos, ListTodos | 手動確認（GET /api/todos?status=active） | 🔧 |
| FC-01-02-002 | SPEC-001 | FR-008 | TBD | TBD | TBD | ❌ |
| FC-02-01-002 | SPEC-001 | FR-009 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodos, handleTodoByID, CreateTodo, UpdateTodo, validateTodoValues, applyStoredDateTime, combineDateAndTime | internal/todo/store_test.go, 手動確認（作成/編集フォームで開始予定日を更新） | ✅ |
| FC-02-01-001 | SPEC-001 | FR-010 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodos, handleTodoByID, CreateTodo, UpdateTodo, validateTodoValues, isValidStartDue, applyStoredDateTime | internal/todo/store_test.go, 手動確認（作成/編集フォームで締切日を更新） | ✅ |
| FC-02-02-001 | SPEC-001 | FR-011 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodos, handleTodoByID, CreateTodo, UpdateTodo, buildTodoFromForm, updateTodo, renderTodoList | internal/todo/store_test.go, 手動確認（担当者の入力・更新・解除） | ✅ |
| FC-02-03-001 | SPEC-001 | FR-012 | cmd/server/api.go, internal/todo/store.go, internal/todo/projects.go, web/index.html, web/app.js, web/styles.css | handleTodos, handleTodoByID, CreateTodo, UpdateTodo, ensureProjectReference, buildTodoFromForm, openProjectPicker, getFilteredProjects, selectProjectByID, renderProjectField, renderProjectOptions, renderTodoList | internal/todo/store_test.go, 手動確認（プロジェクトコンボボックスの検索・選択・解除） | ✅ |
| FC-02-03-002 | SPEC-001 | FR-021 | cmd/server/api.go, cmd/server/main.go, internal/todo/projects.go, web/index.html, web/app.js, web/styles.css | handleProjects, handleProjectByID, CreateProject, UpdateProject, DeleteProject, ListProjects, loadProjects, openProjectCreator, syncProjectCreateAction, submitProjectCreator, submitProjectEditor, deleteProject, renderProjectManagementList | internal/todo/store_test.go, 手動確認（ドロップダウン内のプロジェクト作成/管理UI） | ✅ |
| FC-03-01-001 | SPEC-001 | FR-013 | cmd/server/api.go, internal/todo/store.go, web/index.html, web/app.js | handleTodos, handleTodoByID, CreateTodo, UpdateTodo, validateParentReference, renderParentOptions, updateTodo, renderTodoList | internal/todo/store_test.go, 手動確認（親指定の作成/編集と一覧表示） | ✅ |
| FC-03-01-002 | SPEC-001 | FR-014 | cmd/server/api.go, internal/todo/store.go, web/app.js | handleTodoByID, UpdateTodo, DeleteTodo, validateParentReference, renderParentOptions, deleteTodo | internal/todo/store_test.go | ✅ |
| FC-05-01-001 | SPEC-001 | FR-015 | web/index.html, web/app.js, web/styles.css | submitTodoForm, createTodo, updateTodo, clearForm, deleteTodo, patchTodo, loadTodos, render, updateFormMode, cancelEditing, syncCreateSummary, buildFormPreview | 手動確認（作成入口の補助文・入力途中サマリ・モード別ボタン文言・キャンセル時の折りたたみ・追加成功後のフォーム維持・更新成功後の折りたたみ・作成/編集/削除/状態変更の即時反映） | ✅ |
| FC-04-02-002 | SPEC-001 | FR-016 | TBD | TBD | TBD | ❌ |
| FC-04-06-001 | SPEC-001 | FR-017 | TBD | TBD | TBD | ❌ |
| FC-05-02-001 | SPEC-001 | FR-018 | web/index.html, web/app.js, web/styles.css | renderNotifications, updateNotificationBadge, bindEvents | 手動確認（通知設定反映・ベル押下でポップオーバー表示） | ✅ |
| FC-06-01-001 | SPEC-001 | FR-019 | web/index.html, web/app.js | createNextRecurringTodo | 手動確認（繰り返しTodo完了時に次回生成） | ✅ |
| FC-04-07-001 | SPEC-001 | FR-020 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-001 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（Docker/Webランタイム起動。desktopは未実装） | 🔧 |
| FC-04-02-002 | SPEC-002 | FR-001 | TBD | TBD | TBD | ❌ |
| FC-04-02-001 | SPEC-002 | FR-002 | Dockerfile, compose.yaml, cmd/server/main.go | main | 手動確認（docker compose up --build） | ✅ |
| FC-04-01-001 | SPEC-002 | FR-003 | cmd/server/main.go, cmd/server/api.go, internal/todo/store.go, web/app.js, Dockerfile, compose.yaml | main, handleTodos, CreateTodo, ListTodos, DeleteTodo, loadTodos, Open | internal/todo/store_test.go, 手動確認（docker compose restart後も保持） | 🔧 |
| FC-04-05-001 | SPEC-002 | FR-004 | TBD | TBD | TBD | ❌ |
| FC-04-05-002 | SPEC-002 | FR-005 | TBD | TBD | TBD | ❌ |
| FC-04-02-002 | SPEC-002 | FR-006 | TBD | TBD | TBD | ❌ |
| FC-04-03-001 | SPEC-002 | FR-007 | cmd/server/main.go | main | 手動確認（GET /healthz） | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | cmd/server/main.go, Dockerfile, compose.yaml, README.md | envOrDefault, main | README手順と設定値で確認 | ✅ |
| FC-04-06-001 | SPEC-002 | FR-009 | TBD | TBD | TBD | ❌ |

# トレーサビリティマトリクス

## ステータス凡例

- `✅`: 実装・テスト・仕様の整合性確認済み
- `🔧`: 実装中。仕様はあるが変更が完了していない
- `⚠️`: 仕様変更またはコード変更が片側にだけ入っている
- `❌`: 未実装
- `🗑️`: 廃止済み。履歴として残す

| 要件ID | 仕様ID | 機能ID(FR/NFR) | 実装ファイル | シンボル種別 | シンボル名 | テストファイル | テストID | ステータス |
|--------|--------|---------------|--------------|------------|-----------|----------------|---------|-----------|
| FC-01-01-001 | SPEC-001 | FR-001 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-001, TC-047 | ✅ |
| FC-01-01-001 | SPEC-001 | FR-001 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-001 | ✅ |
| FC-01-01-001 | SPEC-001 | FR-001 | web/app.js | function | createTodo | 手動確認 | TC-001, TC-047 | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-002, TC-040 | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-002 | ✅ |
| FC-01-01-002 | SPEC-001 | FR-002 | web/app.js | function | submitTodoForm, updateTodo, beginEditing, scrollTodoFormIntoView, focusTodoTitleField | 手動確認 | TC-002, TC-040, TC-047 | ✅ |
| FC-01-01-003 | SPEC-001 | FR-003 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-003, TC-034 | ✅ |
| FC-01-01-003 | SPEC-001 | FR-003 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-003 | ✅ |
| FC-01-01-003 | SPEC-001 | FR-003 | web/app.js | function | deleteTodo, promptDeleteTodo, confirmDeleteTodo | 手動確認 | TC-003, TC-034 | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-004, TC-005 | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-004, TC-005 | ✅ |
| FC-01-01-001 | SPEC-001 | FR-004 | web/app.js | function | createTodo | 手動確認 | TC-004, TC-005 | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-006 | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | internal/todo/store.go | function | ListTodos | internal/todo/store_test.go | TC-006 | ✅ |
| FC-01-02-001 | SPEC-001 | FR-005 | web/app.js | function | renderTodoView, getVisibleTodos, getTodoHeadingText, renderTodoList, renderTodoRow, toggleTodoDetails | 手動確認 | TC-006, TC-039, TC-045, TC-046 | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-008~TC-012, TC-038 | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-008~TC-012 | ✅ |
| FC-01-03-001 | SPEC-001 | FR-006 | web/app.js | function | patchTodo, setTodoStatus, renderStatusButtons, getStatusText | 手動確認 | TC-038 | ✅ |
| FC-01-03-002 | SPEC-001 | FR-007 | cmd/server/api.go | handler | handleTodos | 手動確認 | TC-007 | 🔧 |
| FC-01-03-002 | SPEC-001 | FR-007 | internal/todo/store.go | function | ListTodos | 手動確認 | TC-007 | 🔧 |
| FC-01-02-002 | SPEC-001 | FR-008 | cmd/server/api.go | handler | handleTodos | 手動確認 | TC-024, TC-025 | ✅ |
| FC-01-02-002 | SPEC-001 | FR-008 | internal/todo/store.go | function | ListTodos | 手動確認 | TC-024, TC-025 | ✅ |
| FC-01-02-002 | SPEC-001 | FR-008 | web/app.js | function | renderTodoView, getVisibleTodos, isTodoVisibleToday, isStartDateAvailableToday, renderTodoList | 手動確認 | TC-024, TC-025, TC-049 | ✅ |
| FC-01-02-003 | SPEC-001 | FR-022 | web/app.js | function | renderTodoView, getVisibleTodos, isTodoVisibleOverdue, renderTodoList | 手動確認 | TC-041, TC-049 | ✅ |
| FC-01-02-004 | SPEC-001 | FR-023 | web/app.js | function | renderTodoView, getVisibleTodos, isTodoVisibleCompleted, renderTodoList | 手動確認 | TC-042, TC-049 | ✅ |
| FC-01-02-005 | SPEC-001 | FR-024 | web/app.js | function | renderTodoView, getVisibleTodos, isTodoVisibleUpcoming, isStartDateUpcoming, renderTodoList | 手動確認 | TC-043, TC-049 | ✅ |
| FC-02-01-002 | SPEC-001 | FR-009 | cmd/server/api.go | handler | handleTodos, handleTodoByID | internal/todo/store_test.go | TC-016, TC-044, TC-048 | ✅ |
| FC-02-01-002 | SPEC-001 | FR-009 | internal/todo/store.go | function | CreateTodo, UpdateTodo, validateTodoValues | internal/todo/store_test.go | TC-016 | ✅ |
| FC-02-01-002 | SPEC-001 | FR-009 | web/app.js | function | applyStoredDateTime, combineDateAndTime, bindTimeFieldPicker, openTimePicker | 手動確認 | TC-044, TC-048 | ✅ |
| FC-02-01-001 | SPEC-001 | FR-010 | cmd/server/api.go | handler | handleTodos, handleTodoByID | internal/todo/store_test.go | TC-013, TC-044, TC-048 | ✅ |
| FC-02-01-001 | SPEC-001 | FR-010 | internal/todo/store.go | function | CreateTodo, UpdateTodo, validateTodoValues | internal/todo/store_test.go | TC-013 | ✅ |
| FC-02-01-001 | SPEC-001 | FR-010 | web/app.js | function | applyStoredDateTime, bindTimeFieldPicker, openTimePicker | 手動確認 | TC-044, TC-048 | ✅ |
| FC-02-02-001 | SPEC-001 | FR-011 | cmd/server/api.go | handler | handleTodos, handleTodoByID | internal/todo/store_test.go | TC-014 | ✅ |
| FC-02-02-001 | SPEC-001 | FR-011 | internal/todo/store.go | function | CreateTodo, UpdateTodo | internal/todo/store_test.go | TC-014 | ✅ |
| FC-02-02-001 | SPEC-001 | FR-011 | web/app.js | function | buildTodoFromForm, updateTodo, renderTodoList | 手動確認 | TC-014 | ✅ |
| FC-02-03-001 | SPEC-001 | FR-012 | cmd/server/api.go | handler | handleTodos, handleTodoByID | internal/todo/store_test.go | TC-015 | ✅ |
| FC-02-03-001 | SPEC-001 | FR-012 | internal/todo/store.go | function | CreateTodo, UpdateTodo, ensureProjectReference | internal/todo/store_test.go | TC-015 | ✅ |
| FC-02-03-001 | SPEC-001 | FR-012 | web/app.js | function | openProjectPicker, getFilteredProjects, selectProjectByID, renderProjectField, renderProjectOptions | 手動確認 | TC-015 | ✅ |
| FC-02-03-001 | SPEC-001 | FR-012 | web/app.js | function | buildTodoFromForm | 手動確認 | TC-015 | ✅ |
| FC-02-03-002 | SPEC-001 | FR-021 | cmd/server/api.go | handler | handleProjects, handleProjectByID | internal/todo/store_test.go | TC-032, TC-033 | ✅ |
| FC-02-03-002 | SPEC-001 | FR-021 | internal/todo/projects.go | function | CreateProject, UpdateProject, DeleteProject, ListProjects | internal/todo/store_test.go | TC-032, TC-033 | ✅ |
| FC-02-03-002 | SPEC-001 | FR-021 | web/app.js | function | loadProjects, openProjectCreator, syncProjectCreateAction, submitProjectCreator, submitProjectEditor, deleteProject, renderProjectManagementList | 手動確認 | TC-032, TC-033 | ✅ |
| FC-03-01-001 | SPEC-001 | FR-013 | cmd/server/api.go | handler | handleTodos, handleTodoByID | internal/todo/store_test.go | TC-017 | ✅ |
| FC-03-01-001 | SPEC-001 | FR-013 | internal/todo/store.go | function | CreateTodo, UpdateTodo, validateParentReference | internal/todo/store_test.go | TC-017 | ✅ |
| FC-03-01-001 | SPEC-001 | FR-013 | web/app.js | function | renderParentOptions, updateTodo, getParentTodoDisplay | 手動確認 | TC-017 | ✅ |
| FC-03-01-001 | SPEC-001 | FR-013 | web/app.js | function | renderTodoList | 手動確認 | TC-017 | ✅ |
| FC-03-01-002 | SPEC-001 | FR-014 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-018, TC-019, TC-020 | ✅ |
| FC-03-01-002 | SPEC-001 | FR-014 | internal/todo/store.go | function | UpdateTodo, DeleteTodo, validateParentReference | internal/todo/store_test.go | TC-018, TC-019, TC-020 | ✅ |
| FC-03-01-002 | SPEC-001 | FR-014 | web/app.js | function | renderParentOptions, deleteTodo | 手動確認 | TC-020 | ✅ |
| FC-05-01-001 | SPEC-001 | FR-015 | web/app.js | function | submitTodoForm, createTodo, updateTodo, clearForm, deleteTodo, patchTodo, loadTodos, render, updateFormMode, cancelEditing, syncCreateSummary, buildFormPreview | 手動確認 | TC-023, TC-035, TC-036, TC-037, TC-048 | ✅ |
| FC-04-02-002 | SPEC-001 | FR-016 | TBD | TBD | TBD | TBD | TC-021 | ❌ |
| FC-04-06-001 | SPEC-001 | FR-017 | TBD | TBD | TBD | TBD | TC-022 | ❌ |
| FC-05-02-001 | SPEC-001 | FR-018 | web/app.js | function | renderNotifications, updateNotificationBadge, bindEvents | 手動確認 | TC-026, TC-027 | ✅ |
| FC-06-01-001 | SPEC-001 | FR-019 | web/app.js | function | createNextRecurringTodo | 手動確認 | TC-028, TC-029 | ✅ |
| FC-04-07-001 | SPEC-001 | FR-020 | TBD | TBD | TBD | TBD | TC-030, TC-031 | ❌ |
| FC-04-02-001 | SPEC-002 | FR-001 | cmd/server/main.go | function | main | 手動確認 | TC-001 | 🔧 |
| FC-04-02-001 | SPEC-002 | FR-001 | Dockerfile | config | Dockerfile | 手動確認 | TC-001 | 🔧 |
| FC-04-02-001 | SPEC-002 | FR-001 | compose.yaml | config | compose.yaml | 手動確認 | TC-001 | 🔧 |
| FC-04-02-002 | SPEC-002 | FR-001 | TBD | TBD | TBD | TBD | TC-001 | ❌ |
| FC-04-02-001 | SPEC-002 | FR-002 | Dockerfile | config | Dockerfile | 手動確認 | TC-003, TC-014 | ✅ |
| FC-04-02-001 | SPEC-002 | FR-002 | compose.yaml | config | compose.yaml | 手動確認 | TC-003 | ✅ |
| FC-04-02-001 | SPEC-002 | FR-002 | cmd/server/main.go | function | main | 手動確認 | TC-003 | ✅ |
| FC-04-01-001 | SPEC-002 | FR-003 | cmd/server/main.go | function | main | internal/todo/store_test.go | TC-004, TC-010 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | internal/todo/store.go | function | CreateTodo, ListTodos, DeleteTodo, Open | internal/todo/store_test.go | TC-004 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | 手動確認 | TC-004 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | Dockerfile | config | Dockerfile | 手動確認 | TC-004 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | compose.yaml | config | compose.yaml | 手動確認 | TC-004 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-004 | 🔧 |
| FC-04-01-001 | SPEC-002 | FR-003 | web/app.js | function | loadTodos | 手動確認 | TC-004 | 🔧 |
| FC-04-05-001 | SPEC-002 | FR-004 | TBD | TBD | TBD | TBD | TC-005 | ❌ |
| FC-04-05-002 | SPEC-002 | FR-005 | TBD | TBD | TBD | TBD | TC-006 | ❌ |
| FC-04-02-002 | SPEC-002 | FR-006 | TBD | TBD | TBD | TBD | TC-007 | ❌ |
| FC-04-03-001 | SPEC-002 | FR-007 | cmd/server/main.go | function | main | 手動確認 | TC-008 | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | cmd/server/main.go | function | envOrDefault, main | 手動確認 | TC-002 | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | Dockerfile | config | Dockerfile | 手動確認 | TC-002 | ✅ |
| FC-04-04-001 | SPEC-002 | FR-008 | compose.yaml | config | compose.yaml | 手動確認 | TC-002 | ✅ |
| NF-007 | SPEC-002 | NFR-008 | .github/workflows/ci.yml | workflow | docker job | 手動確認 | TC-013 | ✅ |
| NF-007 | SPEC-002 | NFR-008 | Dockerfile | config | Dockerfile | 手動確認 | TC-013 | ✅ |
| NF-007 | SPEC-002 | NFR-008 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | 手動確認 | TC-013 | ✅ |
| NF-007 | SPEC-002 | NFR-008 | compose.yaml | config | compose.yaml | 手動確認 | TC-013 | ✅ |
| FC-04-06-001 | SPEC-002 | FR-009 | TBD | TBD | TBD | TBD | TC-009 | ❌ |
| NF-003 | SPEC-002 | NFR-006 | Dockerfile | config | Dockerfile | 手動確認 | TC-011 | ✅ |
| NF-003 | SPEC-002 | NFR-006 | compose.yaml | config | compose.yaml | 手動確認 | TC-011 | ✅ |
| NF-003 | SPEC-002 | NFR-006 | docker-entrypoint.sh | entrypoint | docker-entrypoint.sh | 手動確認 | TC-011 | ✅ |
| NF-004 | SPEC-002 | NFR-007 | TBD | TBD | TBD | TBD | TC-012 | ❌ |
| NF-002 | SPEC-001 | NFR-001 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-090, TC-091, TC-092 | 🔧 |
| NF-002 | SPEC-001 | NFR-001 | internal/todo/store.go | function | ListTodos | internal/todo/store_test.go | TC-090, TC-091 | 🔧 |
| NF-005 | SPEC-001 | NFR-002 | internal/todo/store.go | function | CreateTodo | internal/todo/store_test.go | TC-093, TC-094, TC-095 | ✅ |
| NF-005 | SPEC-001 | NFR-002 | internal/todo/store.go | function | UpdateTodo | internal/todo/store_test.go | TC-093, TC-094 | ✅ |
| NF-005 | SPEC-001 | NFR-002 | internal/todo/store.go | function | DeleteTodo | internal/todo/store_test.go | TC-093, TC-094 | ✅ |
| NF-005 | SPEC-001 | NFR-003 | cmd/server/api.go | handler | handleTodos | internal/todo/store_test.go | TC-096, TC-097 | ✅ |
| NF-005 | SPEC-001 | NFR-003 | cmd/server/api.go | handler | handleTodoByID | internal/todo/store_test.go | TC-096, TC-097 | ✅ |
| NF-005 | SPEC-001 | NFR-003 | web/app.js | function | createTodo | 手動確認 | TC-098 | 🔧 |
| NF-001 | SPEC-001 | NFR-004 | TBD | TBD | TBD | TBD | TC-099, TC-100, TC-101 | ❌ |

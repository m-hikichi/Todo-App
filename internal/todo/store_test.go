package todo

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"
)

func TestStorePersistsTodosAcrossReopen(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	mustCreateLabel(t, store, ctx, "home")
	mustCreateLabel(t, store, ctx, "shopping")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:          "Buy milk",
		Description:    "2 liters",
		Status:         "active",
		StartDate:      "2026-03-15",
		DueDate:        "2026-03-16T09:00",
		Assignee:       "Mika",
		Labels:         []string{"home", "shopping"},
		RecurrenceRule: "weekly",
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	todos, err := reopened.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo, got %d", len(todos))
	}
	if todos[0].Title != created.Title {
		t.Fatalf("expected title %q, got %q", created.Title, todos[0].Title)
	}
	if todos[0].DueDate != created.DueDate {
		t.Fatalf("expected due date %q, got %q", created.DueDate, todos[0].DueDate)
	}
	if reopened.Path() != filepath.Join(dataDir, "todo.db") {
		t.Fatalf("unexpected db path: %s", reopened.Path())
	}
}

func TestDeleteTodoClearsChildParentReference(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	parent, err := store.CreateTodo(ctx, CreateInput{Title: "Parent", Status: "active"})
	if err != nil {
		t.Fatalf("CreateTodo parent failed: %v", err)
	}
	child, err := store.CreateTodo(ctx, CreateInput{
		Title:        "Child",
		Status:       "active",
		ParentTodoID: &parent.ID,
	})
	if err != nil {
		t.Fatalf("CreateTodo child failed: %v", err)
	}

	if err := store.DeleteTodo(ctx, parent.ID); err != nil {
		t.Fatalf("DeleteTodo failed: %v", err)
	}

	todos, err := store.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo after delete, got %d", len(todos))
	}
	if todos[0].ID != child.ID {
		t.Fatalf("expected child todo to remain, got id %d", todos[0].ID)
	}
	if todos[0].ParentTodoID != nil {
		t.Fatalf("expected child parent_todo_id to be nil, got %v", *todos[0].ParentTodoID)
	}
}

func TestUpdateTodoPersistsStatus(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	created, err := store.CreateTodo(ctx, CreateInput{Title: "Status target", Status: "active"})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	updated, err := store.UpdateTodo(ctx, created.ID, UpdateInput{
		Status: OptionalString{Set: true, Value: "completed"},
	})
	if err != nil {
		t.Fatalf("UpdateTodo failed: %v", err)
	}
	if updated.Status != "completed" {
		t.Fatalf("expected updated status completed, got %s", updated.Status)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	todos, err := reopened.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo, got %d", len(todos))
	}
	if todos[0].Status != "completed" {
		t.Fatalf("expected reopened status completed, got %s", todos[0].Status)
	}
}

func TestUpdateTodoPersistsEditableFields(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	mustCreateLabel(t, store, ctx, "work")
	mustCreateLabel(t, store, ctx, "priority-high")
	parent, err := store.CreateTodo(ctx, CreateInput{Title: "Parent", Status: "active"})
	if err != nil {
		t.Fatalf("CreateTodo parent failed: %v", err)
	}
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:       "Draft title",
		Description: "Draft description",
		Status:      "active",
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	updated, err := store.UpdateTodo(ctx, created.ID, UpdateInput{
		Title:          OptionalString{Set: true, Value: "Edited title"},
		Description:    OptionalString{Set: true, Value: "Edited description"},
		StartDate:      OptionalString{Set: true, Value: "2026-03-18T08:30"},
		DueDate:        OptionalString{Set: true, Value: "2026-03-19"},
		Assignee:       OptionalString{Set: true, Value: "Jun"},
		Labels:         OptionalStrings{Set: true, Value: []string{"work", "priority-high"}},
		RecurrenceRule: OptionalString{Set: true, Value: "monthly"},
		ParentTodoID:   OptionalInt64{Set: true, Valid: true, Value: parent.ID},
	})
	if err != nil {
		t.Fatalf("UpdateTodo failed: %v", err)
	}
	if updated.Title != "Edited title" || updated.Description != "Edited description" {
		t.Fatalf("unexpected updated title/description: %#v", updated)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	todos, err := reopened.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 2 {
		t.Fatalf("expected 2 todos, got %d", len(todos))
	}

	var edited Todo
	for _, todo := range todos {
		if todo.ID == created.ID {
			edited = todo
			break
		}
	}
	if edited.ID == 0 {
		t.Fatal("edited todo not found after reopen")
	}
	if edited.Title != "Edited title" {
		t.Fatalf("expected edited title, got %q", edited.Title)
	}
	if edited.Description != "Edited description" {
		t.Fatalf("expected edited description, got %q", edited.Description)
	}
	if edited.StartDate != "2026-03-18T08:30" {
		t.Fatalf("expected edited start date, got %q", edited.StartDate)
	}
	if edited.DueDate != "2026-03-19" {
		t.Fatalf("expected edited due date, got %q", edited.DueDate)
	}
	if edited.Assignee != "Jun" {
		t.Fatalf("expected edited assignee, got %q", edited.Assignee)
	}
	if len(edited.Labels) != 2 || edited.Labels[0] != "work" || edited.Labels[1] != "priority-high" {
		t.Fatalf("unexpected edited labels: %#v", edited.Labels)
	}
	if edited.RecurrenceRule != "monthly" {
		t.Fatalf("expected edited recurrence, got %q", edited.RecurrenceRule)
	}
	if edited.ParentTodoID == nil || *edited.ParentTodoID != parent.ID {
		t.Fatalf("expected edited parent id %d, got %v", parent.ID, edited.ParentTodoID)
	}
}

func TestCreateLabelPersistsAcrossReopen(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	created := mustCreateLabel(t, store, ctx, "Work")
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	labels, err := reopened.ListLabels(ctx)
	if err != nil {
		t.Fatalf("ListLabels failed: %v", err)
	}
	if len(labels) != 1 {
		t.Fatalf("expected 1 label, got %d", len(labels))
	}
	if labels[0].Name != created.Name {
		t.Fatalf("expected label %q, got %q", created.Name, labels[0].Name)
	}
}

func TestUpdateLabelRenamesTodos(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	label := mustCreateLabel(t, store, ctx, "Home")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:  "Buy milk",
		Status: "active",
		Labels: []string{"Home"},
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	updated, err := store.UpdateLabel(ctx, label.ID, UpdateLabelInput{Name: "Errands"})
	if err != nil {
		t.Fatalf("UpdateLabel failed: %v", err)
	}
	if updated.Name != "Errands" {
		t.Fatalf("expected updated label name Errands, got %q", updated.Name)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	labels, err := reopened.ListLabels(ctx)
	if err != nil {
		t.Fatalf("ListLabels failed: %v", err)
	}
	if len(labels) != 1 || labels[0].Name != "Errands" {
		t.Fatalf("unexpected labels after rename: %#v", labels)
	}

	todos, err := reopened.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo after reopen, got %d", len(todos))
	}
	if todos[0].ID != created.ID {
		t.Fatalf("expected todo id %d, got %d", created.ID, todos[0].ID)
	}
	if len(todos[0].Labels) != 1 || todos[0].Labels[0] != "Errands" {
		t.Fatalf("unexpected todo labels after label rename: %#v", todos[0].Labels)
	}
}

func TestDeleteLabelRemovesItFromTodos(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	home := mustCreateLabel(t, store, ctx, "home")
	mustCreateLabel(t, store, ctx, "work")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:  "Prepare report",
		Status: "active",
		Labels: []string{"home", "work"},
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	if err := store.DeleteLabel(ctx, home.ID); err != nil {
		t.Fatalf("DeleteLabel failed: %v", err)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	labels, err := reopened.ListLabels(ctx)
	if err != nil {
		t.Fatalf("ListLabels failed: %v", err)
	}
	if len(labels) != 1 || labels[0].Name != "work" {
		t.Fatalf("unexpected labels after delete: %#v", labels)
	}

	todos, err := reopened.ListTodos(ctx, "all")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo after reopen, got %d", len(todos))
	}
	if todos[0].ID != created.ID {
		t.Fatalf("expected todo id %d, got %d", created.ID, todos[0].ID)
	}
	if len(todos[0].Labels) != 1 || todos[0].Labels[0] != "work" {
		t.Fatalf("unexpected todo labels after label delete: %#v", todos[0].Labels)
	}
}

func TestCreateTodoRejectsUnknownLabels(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	_, err := store.CreateTodo(ctx, CreateInput{
		Title:  "Unknown label todo",
		Status: "active",
		Labels: []string{"missing"},
	})
	if err == nil {
		t.Fatal("expected unknown label validation error, got nil")
	}
	if !IsValidationError(err) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestOpenSeedsLabelsFromExistingTodos(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	db, err := sql.Open("sqlite3", filepath.Join(dataDir, "todo.db"))
	if err != nil {
		t.Fatalf("sql.Open failed: %v", err)
	}
	defer func() { _ = db.Close() }()

	_, err = db.ExecContext(
		ctx,
		`CREATE TABLE todos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL,
			start_date TEXT NOT NULL DEFAULT '',
			due_date TEXT NOT NULL DEFAULT '',
			assignee TEXT NOT NULL DEFAULT '',
			labels_json TEXT NOT NULL DEFAULT '[]',
			recurrence_rule TEXT NOT NULL DEFAULT 'none',
			parent_todo_id INTEGER,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
	)
	if err != nil {
		t.Fatalf("create legacy todo schema failed: %v", err)
	}
	_, err = db.ExecContext(
		ctx,
		`INSERT INTO todos (title, description, status, labels_json, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		"Legacy todo",
		"",
		"active",
		`["legacy","ops"]`,
		"2026-03-14T00:00:00Z",
		"2026-03-14T00:00:00Z",
	)
	if err != nil {
		t.Fatalf("insert legacy todo failed: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close legacy db failed: %v", err)
	}

	store := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = store.Close() })

	labels, err := store.ListLabels(ctx)
	if err != nil {
		t.Fatalf("ListLabels failed: %v", err)
	}
	if len(labels) != 2 {
		t.Fatalf("expected 2 labels, got %d", len(labels))
	}
	if labels[0].Name != "legacy" || labels[1].Name != "ops" {
		t.Fatalf("unexpected seeded labels: %#v", labels)
	}
}

func TestUpdateTodoRejectsParentCycles(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	parent, err := store.CreateTodo(ctx, CreateInput{Title: "Parent", Status: "active"})
	if err != nil {
		t.Fatalf("CreateTodo parent failed: %v", err)
	}
	child, err := store.CreateTodo(ctx, CreateInput{
		Title:        "Child",
		Status:       "active",
		ParentTodoID: &parent.ID,
	})
	if err != nil {
		t.Fatalf("CreateTodo child failed: %v", err)
	}

	_, err = store.UpdateTodo(ctx, parent.ID, UpdateInput{
		ParentTodoID: OptionalInt64{Set: true, Valid: true, Value: child.ID},
	})
	if err == nil {
		t.Fatal("expected cycle validation error, got nil")
	}
	if !IsValidationError(err) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func openTestStore(t *testing.T, dataDir string) *Store {
	t.Helper()

	store, err := Open(dataDir)
	if err != nil {
		t.Fatalf("Open failed: %v", err)
	}
	return store
}

func mustCreateLabel(t *testing.T, store *Store, ctx context.Context, name string) Label {
	t.Helper()

	label, err := store.CreateLabel(ctx, CreateLabelInput{Name: name})
	if err != nil {
		t.Fatalf("CreateLabel(%q) failed: %v", name, err)
	}
	return label
}

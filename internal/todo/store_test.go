package todo

import (
	"context"
	"path/filepath"
	"testing"
)

func TestStorePersistsTodosAcrossReopen(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
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

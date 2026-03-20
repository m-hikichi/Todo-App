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
	project := mustCreateProject(t, store, ctx, "shopping")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:          "Buy milk",
		Description:    "2 liters",
		Status:         "active",
		StartDate:      "2026-03-15",
		DueDate:        "2026-03-16T09:00",
		Assignee:       "Mika",
		ProjectID:      &project.ID,
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

	todos, err := reopened.ListTodos(ctx, "all", "")
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
	if todos[0].ProjectID == nil || *todos[0].ProjectID != project.ID {
		t.Fatalf("expected project id %d, got %v", project.ID, todos[0].ProjectID)
	}
	if todos[0].Project == nil || todos[0].Project.Name != project.Name {
		t.Fatalf("expected project %q, got %#v", project.Name, todos[0].Project)
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

	todos, err := store.ListTodos(ctx, "all", "")
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

	todos, err := reopened.ListTodos(ctx, "all", "")
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
	project := mustCreateProject(t, store, ctx, "work")
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
		ProjectID:      OptionalInt64{Set: true, Valid: true, Value: project.ID},
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

	todos, err := reopened.ListTodos(ctx, "all", "")
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
	if edited.ProjectID == nil || *edited.ProjectID != project.ID {
		t.Fatalf("expected edited project id %d, got %v", project.ID, edited.ProjectID)
	}
	if edited.Project == nil || edited.Project.Name != project.Name {
		t.Fatalf("unexpected edited project: %#v", edited.Project)
	}
	if edited.RecurrenceRule != "monthly" {
		t.Fatalf("expected edited recurrence, got %q", edited.RecurrenceRule)
	}
	if edited.ParentTodoID == nil || *edited.ParentTodoID != parent.ID {
		t.Fatalf("expected edited parent id %d, got %v", parent.ID, edited.ParentTodoID)
	}
}

func TestListTodosFiltersByKeywordInTitleAndDescription(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	milkTodo, err := store.CreateTodo(ctx, CreateInput{
		Title:       "Buy milk",
		Description: "2 liters for breakfast",
		Status:      "active",
	})
	if err != nil {
		t.Fatalf("CreateTodo milkTodo failed: %v", err)
	}
	_, err = store.CreateTodo(ctx, CreateInput{
		Title:       "Prepare slides",
		Description: "Quarterly review deck",
		Status:      "active",
	})
	if err != nil {
		t.Fatalf("CreateTodo slides failed: %v", err)
	}

	results, err := store.ListTodos(ctx, "all", "  MILK  ")
	if err != nil {
		t.Fatalf("ListTodos title search failed: %v", err)
	}
	if len(results) != 1 || results[0].ID != milkTodo.ID {
		t.Fatalf("expected only milk todo from title search, got %#v", results)
	}

	results, err = store.ListTodos(ctx, "all", "breakfast")
	if err != nil {
		t.Fatalf("ListTodos description search failed: %v", err)
	}
	if len(results) != 1 || results[0].ID != milkTodo.ID {
		t.Fatalf("expected only milk todo from description search, got %#v", results)
	}
}

func TestListTodosFiltersByKeywordInAssigneeAndProject(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	project := mustCreateProject(t, store, ctx, "Home")
	assigneeTodo, err := store.CreateTodo(ctx, CreateInput{
		Title:    "Call Mika",
		Status:   "active",
		Assignee: "Mika",
	})
	if err != nil {
		t.Fatalf("CreateTodo assigneeTodo failed: %v", err)
	}
	projectTodo, err := store.CreateTodo(ctx, CreateInput{
		Title:     "Buy detergent",
		Status:    "waiting",
		ProjectID: &project.ID,
	})
	if err != nil {
		t.Fatalf("CreateTodo projectTodo failed: %v", err)
	}

	results, err := store.ListTodos(ctx, "all", "mika")
	if err != nil {
		t.Fatalf("ListTodos assignee search failed: %v", err)
	}
	if len(results) != 1 || results[0].ID != assigneeTodo.ID {
		t.Fatalf("expected only assignee todo from assignee search, got %#v", results)
	}

	results, err = store.ListTodos(ctx, "waiting", "HOME")
	if err != nil {
		t.Fatalf("ListTodos project search failed: %v", err)
	}
	if len(results) != 1 || results[0].ID != projectTodo.ID {
		t.Fatalf("expected only project todo from project search, got %#v", results)
	}
}

func TestCreateProjectPersistsAcrossReopen(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	created := mustCreateProject(t, store, ctx, "Work")
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	projects, err := reopened.ListProjects(ctx)
	if err != nil {
		t.Fatalf("ListProjects failed: %v", err)
	}
	if len(projects) != 1 {
		t.Fatalf("expected 1 project, got %d", len(projects))
	}
	if projects[0].Name != created.Name {
		t.Fatalf("expected project %q, got %q", created.Name, projects[0].Name)
	}
}

func TestUpdateProjectRenamesTodoProjection(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	project := mustCreateProject(t, store, ctx, "Home")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:     "Buy milk",
		Status:    "active",
		ProjectID: &project.ID,
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	updated, err := store.UpdateProject(ctx, project.ID, UpdateProjectInput{Name: "Errands"})
	if err != nil {
		t.Fatalf("UpdateProject failed: %v", err)
	}
	if updated.Name != "Errands" {
		t.Fatalf("expected updated project name Errands, got %q", updated.Name)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	projects, err := reopened.ListProjects(ctx)
	if err != nil {
		t.Fatalf("ListProjects failed: %v", err)
	}
	if len(projects) != 1 || projects[0].Name != "Errands" {
		t.Fatalf("unexpected projects after rename: %#v", projects)
	}

	todos, err := reopened.ListTodos(ctx, "all", "")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo after reopen, got %d", len(todos))
	}
	if todos[0].ID != created.ID {
		t.Fatalf("expected todo id %d, got %d", created.ID, todos[0].ID)
	}
	if todos[0].ProjectID == nil || *todos[0].ProjectID != project.ID {
		t.Fatalf("expected todo project id %d, got %v", project.ID, todos[0].ProjectID)
	}
	if todos[0].Project == nil || todos[0].Project.Name != "Errands" {
		t.Fatalf("unexpected todo project after rename: %#v", todos[0].Project)
	}
}

func TestDeleteProjectClearsTodoReference(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()

	store := openTestStore(t, dataDir)
	project := mustCreateProject(t, store, ctx, "home")
	mustCreateProject(t, store, ctx, "work")
	created, err := store.CreateTodo(ctx, CreateInput{
		Title:     "Prepare report",
		Status:    "active",
		ProjectID: &project.ID,
	})
	if err != nil {
		t.Fatalf("CreateTodo failed: %v", err)
	}

	if err := store.DeleteProject(ctx, project.ID); err != nil {
		t.Fatalf("DeleteProject failed: %v", err)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	reopened := openTestStore(t, dataDir)
	t.Cleanup(func() { _ = reopened.Close() })

	projects, err := reopened.ListProjects(ctx)
	if err != nil {
		t.Fatalf("ListProjects failed: %v", err)
	}
	if len(projects) != 1 || projects[0].Name != "work" {
		t.Fatalf("unexpected projects after delete: %#v", projects)
	}

	todos, err := reopened.ListTodos(ctx, "all", "")
	if err != nil {
		t.Fatalf("ListTodos failed: %v", err)
	}
	if len(todos) != 1 {
		t.Fatalf("expected 1 todo after reopen, got %d", len(todos))
	}
	if todos[0].ID != created.ID {
		t.Fatalf("expected todo id %d, got %d", created.ID, todos[0].ID)
	}
	if todos[0].ProjectID != nil {
		t.Fatalf("expected todo project to be cleared, got %v", todos[0].ProjectID)
	}
	if todos[0].Project != nil {
		t.Fatalf("expected todo project projection to be nil, got %#v", todos[0].Project)
	}
}

func TestCreateTodoRejectsUnknownProject(t *testing.T) {
	ctx := context.Background()
	store := openTestStore(t, t.TempDir())
	t.Cleanup(func() { _ = store.Close() })

	missingProjectID := int64(999)
	_, err := store.CreateTodo(ctx, CreateInput{
		Title:     "Unknown project todo",
		Status:    "active",
		ProjectID: &missingProjectID,
	})
	if err == nil {
		t.Fatal("expected unknown project validation error, got nil")
	}
	if !IsValidationError(err) {
		t.Fatalf("expected validation error, got %v", err)
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

func mustCreateProject(t *testing.T, store *Store, ctx context.Context, name string) Project {
	t.Helper()

	project, err := store.CreateProject(ctx, CreateProjectInput{Name: name})
	if err != nil {
		t.Fatalf("CreateProject(%q) failed: %v", name, err)
	}
	return project
}

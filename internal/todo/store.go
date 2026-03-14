package todo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var (
	ErrNotFound = errors.New("todo not found")
	jstZone     = time.FixedZone("JST", 9*60*60)
)

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

func IsValidationError(err error) bool {
	var target *ValidationError
	return errors.As(err, &target)
}

type Todo struct {
	ID             int64    `json:"id"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Status         string   `json:"status"`
	StartDate      string   `json:"start_date"`
	DueDate        string   `json:"due_date"`
	Assignee       string   `json:"assignee"`
	Labels         []string `json:"labels"`
	RecurrenceRule string   `json:"recurrence_rule"`
	ParentTodoID   *int64   `json:"parent_todo_id"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

type CreateInput struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Status         string   `json:"status"`
	StartDate      string   `json:"start_date"`
	DueDate        string   `json:"due_date"`
	Assignee       string   `json:"assignee"`
	Labels         []string `json:"labels"`
	RecurrenceRule string   `json:"recurrence_rule"`
	ParentTodoID   *int64   `json:"parent_todo_id"`
}

type OptionalString struct {
	Set   bool
	Value string
}

func (o *OptionalString) UnmarshalJSON(data []byte) error {
	o.Set = true
	if string(data) == "null" {
		o.Value = ""
		return nil
	}
	return json.Unmarshal(data, &o.Value)
}

type OptionalStrings struct {
	Set   bool
	Value []string
}

func (o *OptionalStrings) UnmarshalJSON(data []byte) error {
	o.Set = true
	if string(data) == "null" {
		o.Value = []string{}
		return nil
	}
	return json.Unmarshal(data, &o.Value)
}

type OptionalInt64 struct {
	Set   bool
	Valid bool
	Value int64
}

func (o *OptionalInt64) UnmarshalJSON(data []byte) error {
	o.Set = true
	if string(data) == "null" {
		o.Valid = false
		o.Value = 0
		return nil
	}
	o.Valid = true
	return json.Unmarshal(data, &o.Value)
}

type UpdateInput struct {
	Title          OptionalString  `json:"title"`
	Description    OptionalString  `json:"description"`
	Status         OptionalString  `json:"status"`
	StartDate      OptionalString  `json:"start_date"`
	DueDate        OptionalString  `json:"due_date"`
	Assignee       OptionalString  `json:"assignee"`
	Labels         OptionalStrings `json:"labels"`
	RecurrenceRule OptionalString  `json:"recurrence_rule"`
	ParentTodoID   OptionalInt64   `json:"parent_todo_id"`
}

type Store struct {
	db     *sql.DB
	dbPath string
	now    func() time.Time
}

func Open(dataDir string) (*Store, error) {
	if strings.TrimSpace(dataDir) == "" {
		dataDir = "data"
	}
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	dbPath := filepath.Join(dataDir, "todo.db")
	db, err := sql.Open("sqlite3", dbPath+"?_busy_timeout=5000&_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("open sqlite db: %w", err)
	}
	db.SetMaxOpenConns(1)

	store := &Store{
		db:     db,
		dbPath: dbPath,
		now: func() time.Time {
			return time.Now().UTC()
		},
	}

	if err := store.initSchema(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}

	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) Path() string {
	return s.dbPath
}

func (s *Store) initSchema(ctx context.Context) error {
	const schema = `
CREATE TABLE IF NOT EXISTS labels (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL COLLATE NOCASE UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS todos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL,
	start_date TEXT NOT NULL DEFAULT '',
	due_date TEXT NOT NULL DEFAULT '',
	assignee TEXT NOT NULL DEFAULT '',
	labels_json TEXT NOT NULL DEFAULT '[]',
	recurrence_rule TEXT NOT NULL DEFAULT 'none',
	parent_todo_id INTEGER REFERENCES todos(id) ON DELETE SET NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
`
	if _, err := s.db.ExecContext(ctx, schema); err != nil {
		return fmt.Errorf("init sqlite schema: %w", err)
	}
	if err := s.seedLabelsFromTodos(ctx); err != nil {
		return fmt.Errorf("seed labels from existing todos: %w", err)
	}
	return nil
}

func (s *Store) ListTodos(ctx context.Context, status string) ([]Todo, error) {
	status = strings.TrimSpace(status)
	if status != "" && status != "all" && !isAllowedStatus(status) {
		return nil, &ValidationError{Message: "status filter is invalid"}
	}

	query := `
SELECT id, title, description, status, start_date, due_date, assignee, labels_json, recurrence_rule, parent_todo_id, created_at, updated_at
FROM todos
`
	args := []any{}
	if status != "" && status != "all" {
		query += "WHERE status = ? "
		args = append(args, status)
	}
	query += "ORDER BY created_at DESC, id DESC"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list todos: %w", err)
	}
	defer rows.Close()

	todos := []Todo{}
	for rows.Next() {
		todo, err := scanTodo(rows)
		if err != nil {
			return nil, err
		}
		todos = append(todos, todo)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate todos: %w", err)
	}

	return todos, nil
}

func (s *Store) CreateTodo(ctx context.Context, input CreateInput) (Todo, error) {
	input = normalizeCreateInput(input)
	if err := validateTodoValues(input.Title, input.Status, input.RecurrenceRule, input.StartDate, input.DueDate); err != nil {
		return Todo{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Todo{}, fmt.Errorf("begin create todo transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if input.ParentTodoID != nil {
		if err := ensureTodoExists(ctx, tx, *input.ParentTodoID); err != nil {
			return Todo{}, err
		}
	}

	resolvedLabels, err := s.resolveLabels(ctx, tx, input.Labels)
	if err != nil {
		return Todo{}, err
	}

	labelsJSON, err := json.Marshal(resolvedLabels)
	if err != nil {
		return Todo{}, fmt.Errorf("encode labels: %w", err)
	}

	now := s.now().Format(time.RFC3339)
	result, err := tx.ExecContext(
		ctx,
		`INSERT INTO todos (title, description, status, start_date, due_date, assignee, labels_json, recurrence_rule, parent_todo_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		input.Title,
		input.Description,
		input.Status,
		input.StartDate,
		input.DueDate,
		input.Assignee,
		string(labelsJSON),
		input.RecurrenceRule,
		input.ParentTodoID,
		now,
		now,
	)
	if err != nil {
		return Todo{}, fmt.Errorf("insert todo: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return Todo{}, fmt.Errorf("get inserted todo id: %w", err)
	}

	todo, err := getTodoByID(ctx, tx, id)
	if err != nil {
		return Todo{}, err
	}

	if err := tx.Commit(); err != nil {
		return Todo{}, fmt.Errorf("commit create todo transaction: %w", err)
	}
	committed = true

	return todo, nil
}

func (s *Store) UpdateTodo(ctx context.Context, id int64, input UpdateInput) (Todo, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Todo{}, fmt.Errorf("begin update todo transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	todo, err := getTodoByID(ctx, tx, id)
	if err != nil {
		return Todo{}, err
	}

	if input.Title.Set {
		todo.Title = strings.TrimSpace(input.Title.Value)
	}
	if input.Description.Set {
		todo.Description = strings.TrimSpace(input.Description.Value)
	}
	if input.Status.Set {
		todo.Status = strings.TrimSpace(input.Status.Value)
	}
	if input.StartDate.Set {
		todo.StartDate = strings.TrimSpace(input.StartDate.Value)
	}
	if input.DueDate.Set {
		todo.DueDate = strings.TrimSpace(input.DueDate.Value)
	}
	if input.Assignee.Set {
		todo.Assignee = strings.TrimSpace(input.Assignee.Value)
	}
	if input.Labels.Set {
		todo.Labels = sanitizeLabels(input.Labels.Value)
	}
	if input.RecurrenceRule.Set {
		todo.RecurrenceRule = strings.TrimSpace(input.RecurrenceRule.Value)
	}
	if input.ParentTodoID.Set {
		if !input.ParentTodoID.Valid {
			todo.ParentTodoID = nil
		} else {
			parentID := input.ParentTodoID.Value
			todo.ParentTodoID = &parentID
		}
	}

	if err := validateTodoValues(todo.Title, todo.Status, todo.RecurrenceRule, todo.StartDate, todo.DueDate); err != nil {
		return Todo{}, err
	}
	if err := validateParentReference(ctx, tx, id, todo.ParentTodoID); err != nil {
		return Todo{}, err
	}
	if input.Labels.Set {
		resolvedLabels, err := s.resolveLabels(ctx, tx, todo.Labels)
		if err != nil {
			return Todo{}, err
		}
		todo.Labels = resolvedLabels
	}

	labelsJSON, err := json.Marshal(sanitizeLabels(todo.Labels))
	if err != nil {
		return Todo{}, fmt.Errorf("encode labels: %w", err)
	}

	todo.UpdatedAt = s.now().Format(time.RFC3339)
	_, err = tx.ExecContext(
		ctx,
		`UPDATE todos
		 SET title = ?, description = ?, status = ?, start_date = ?, due_date = ?, assignee = ?, labels_json = ?, recurrence_rule = ?, parent_todo_id = ?, updated_at = ?
		 WHERE id = ?`,
		todo.Title,
		todo.Description,
		todo.Status,
		todo.StartDate,
		todo.DueDate,
		todo.Assignee,
		string(labelsJSON),
		todo.RecurrenceRule,
		todo.ParentTodoID,
		todo.UpdatedAt,
		id,
	)
	if err != nil {
		return Todo{}, fmt.Errorf("update todo: %w", err)
	}

	updatedTodo, err := getTodoByID(ctx, tx, id)
	if err != nil {
		return Todo{}, err
	}

	if err := tx.Commit(); err != nil {
		return Todo{}, fmt.Errorf("commit update todo transaction: %w", err)
	}
	committed = true

	return updatedTodo, nil
}

func (s *Store) DeleteTodo(ctx context.Context, id int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin delete todo transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	result, err := tx.ExecContext(ctx, `DELETE FROM todos WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete todo: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted todo count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit delete todo transaction: %w", err)
	}
	committed = true

	return nil
}

func normalizeCreateInput(input CreateInput) CreateInput {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Status = strings.TrimSpace(input.Status)
	if input.Status == "" {
		input.Status = "active"
	}
	input.StartDate = strings.TrimSpace(input.StartDate)
	input.DueDate = strings.TrimSpace(input.DueDate)
	input.Assignee = strings.TrimSpace(input.Assignee)
	input.Labels = sanitizeLabels(input.Labels)
	input.RecurrenceRule = strings.TrimSpace(input.RecurrenceRule)
	if input.RecurrenceRule == "" {
		input.RecurrenceRule = "none"
	}
	return input
}

func sanitizeLabels(labels []string) []string {
	if len(labels) == 0 {
		return []string{}
	}

	seen := make(map[string]struct{}, len(labels))
	cleaned := make([]string, 0, len(labels))
	for _, label := range labels {
		label = strings.TrimSpace(label)
		if label == "" {
			continue
		}
		if _, ok := seen[label]; ok {
			continue
		}
		seen[label] = struct{}{}
		cleaned = append(cleaned, label)
	}
	return cleaned
}

func validateTodoValues(title, status, recurrenceRule, startDate, dueDate string) error {
	if title == "" {
		return &ValidationError{Message: "title is required"}
	}
	if len([]rune(title)) > 120 {
		return &ValidationError{Message: "title must be 120 characters or fewer"}
	}
	if !isAllowedStatus(status) {
		return &ValidationError{Message: "status is invalid"}
	}
	if !isAllowedRecurrence(recurrenceRule) {
		return &ValidationError{Message: "recurrence_rule is invalid"}
	}

	if _, err := parseScheduleValue(startDate, false); err != nil {
		return &ValidationError{Message: "start_date must be a valid JST date/time value"}
	}
	if _, err := parseScheduleValue(dueDate, true); err != nil {
		return &ValidationError{Message: "due_date must be a valid JST date/time value"}
	}

	if startDate != "" && dueDate != "" {
		startAt, _ := parseScheduleValue(startDate, false)
		dueAt, _ := parseScheduleValue(dueDate, true)
		if dueAt.Before(startAt) {
			return &ValidationError{Message: "due_date must be on or after start_date"}
		}
	}

	return nil
}

func parseScheduleValue(value string, endOfDay bool) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, nil
	}

	layouts := []struct {
		layout   string
		location *time.Location
	}{
		{layout: "2006-01-02", location: jstZone},
		{layout: "2006-01-02T15:04", location: jstZone},
		{layout: "2006-01-02T15:04:05", location: jstZone},
	}

	for _, candidate := range layouts {
		parsed, err := time.ParseInLocation(candidate.layout, value, candidate.location)
		if err == nil {
			if candidate.layout == "2006-01-02" && endOfDay {
				parsed = parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			}
			return parsed, nil
		}
	}

	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}

	return time.Time{}, fmt.Errorf("invalid date/time: %s", value)
}

func isAllowedStatus(status string) bool {
	switch status {
	case "active", "in_progress", "waiting", "completed":
		return true
	default:
		return false
	}
}

func isAllowedRecurrence(rule string) bool {
	switch rule {
	case "none", "daily", "weekly", "monthly":
		return true
	default:
		return false
	}
}

func ensureTodoExists(ctx context.Context, tx *sql.Tx, id int64) error {
	var exists int
	err := tx.QueryRowContext(ctx, `SELECT 1 FROM todos WHERE id = ?`, id).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return &ValidationError{Message: "parent_todo_id was not found"}
	}
	if err != nil {
		return fmt.Errorf("check todo existence: %w", err)
	}
	return nil
}

func validateParentReference(ctx context.Context, tx *sql.Tx, todoID int64, parentTodoID *int64) error {
	if parentTodoID == nil {
		return nil
	}
	if *parentTodoID == todoID {
		return &ValidationError{Message: "parent_todo_id cannot reference the same todo"}
	}
	if err := ensureTodoExists(ctx, tx, *parentTodoID); err != nil {
		return err
	}

	currentParentID := *parentTodoID
	seen := map[int64]struct{}{}
	for {
		if currentParentID == todoID {
			return &ValidationError{Message: "parent_todo_id would create a cycle"}
		}
		if _, ok := seen[currentParentID]; ok {
			return &ValidationError{Message: "parent_todo_id would create a cycle"}
		}
		seen[currentParentID] = struct{}{}

		var nextParent sql.NullInt64
		err := tx.QueryRowContext(ctx, `SELECT parent_todo_id FROM todos WHERE id = ?`, currentParentID).Scan(&nextParent)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil
			}
			return fmt.Errorf("check parent chain: %w", err)
		}
		if !nextParent.Valid {
			return nil
		}
		currentParentID = nextParent.Int64
	}
}

func getTodoByID(ctx context.Context, tx *sql.Tx, id int64) (Todo, error) {
	row := tx.QueryRowContext(
		ctx,
		`SELECT id, title, description, status, start_date, due_date, assignee, labels_json, recurrence_rule, parent_todo_id, created_at, updated_at
		 FROM todos
		 WHERE id = ?`,
		id,
	)

	todo, err := scanTodo(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Todo{}, ErrNotFound
	}
	if err != nil {
		return Todo{}, err
	}
	return todo, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanTodo(s scanner) (Todo, error) {
	var (
		todo       Todo
		labelsJSON string
		parentID   sql.NullInt64
	)

	if err := s.Scan(
		&todo.ID,
		&todo.Title,
		&todo.Description,
		&todo.Status,
		&todo.StartDate,
		&todo.DueDate,
		&todo.Assignee,
		&labelsJSON,
		&todo.RecurrenceRule,
		&parentID,
		&todo.CreatedAt,
		&todo.UpdatedAt,
	); err != nil {
		return Todo{}, err
	}

	if labelsJSON == "" {
		todo.Labels = []string{}
	} else if err := json.Unmarshal([]byte(labelsJSON), &todo.Labels); err != nil {
		return Todo{}, fmt.Errorf("decode labels: %w", err)
	}

	if parentID.Valid {
		parent := parentID.Int64
		todo.ParentTodoID = &parent
	}
	if todo.Labels == nil {
		todo.Labels = []string{}
	}

	return todo, nil
}

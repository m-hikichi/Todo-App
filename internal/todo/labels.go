package todo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	sqlite3 "github.com/mattn/go-sqlite3"
)

var ErrLabelNotFound = errors.New("label not found")

type Label struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateLabelInput struct {
	Name string `json:"name"`
}

type UpdateLabelInput struct {
	Name string `json:"name"`
}

func (s *Store) ListLabels(ctx context.Context) ([]Label, error) {
	rows, err := s.db.QueryContext(
		ctx,
		`SELECT id, name, created_at, updated_at
		 FROM labels
		 ORDER BY name COLLATE NOCASE ASC, id ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list labels: %w", err)
	}
	defer rows.Close()

	labels := []Label{}
	for rows.Next() {
		label, err := scanLabel(rows)
		if err != nil {
			return nil, err
		}
		labels = append(labels, label)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate labels: %w", err)
	}

	return labels, nil
}

func (s *Store) CreateLabel(ctx context.Context, input CreateLabelInput) (Label, error) {
	input.Name = strings.TrimSpace(input.Name)
	if err := validateLabelName(input.Name); err != nil {
		return Label{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Label{}, fmt.Errorf("begin create label transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	now := s.now().Format(time.RFC3339)
	result, err := tx.ExecContext(
		ctx,
		`INSERT INTO labels (name, created_at, updated_at)
		 VALUES (?, ?, ?)`,
		input.Name,
		now,
		now,
	)
	if err != nil {
		if isUniqueLabelConstraint(err) {
			return Label{}, &ValidationError{Message: "label already exists"}
		}
		return Label{}, fmt.Errorf("insert label: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return Label{}, fmt.Errorf("get inserted label id: %w", err)
	}

	label, err := getLabelByID(ctx, tx, id)
	if err != nil {
		return Label{}, err
	}

	if err := tx.Commit(); err != nil {
		return Label{}, fmt.Errorf("commit create label transaction: %w", err)
	}
	committed = true

	return label, nil
}

func (s *Store) UpdateLabel(ctx context.Context, id int64, input UpdateLabelInput) (Label, error) {
	input.Name = strings.TrimSpace(input.Name)
	if err := validateLabelName(input.Name); err != nil {
		return Label{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Label{}, fmt.Errorf("begin update label transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	label, err := getLabelByID(ctx, tx, id)
	if err != nil {
		return Label{}, err
	}

	now := s.now().Format(time.RFC3339)
	_, err = tx.ExecContext(
		ctx,
		`UPDATE labels
		 SET name = ?, updated_at = ?
		 WHERE id = ?`,
		input.Name,
		now,
		id,
	)
	if err != nil {
		if isUniqueLabelConstraint(err) {
			return Label{}, &ValidationError{Message: "label already exists"}
		}
		return Label{}, fmt.Errorf("update label: %w", err)
	}

	if label.Name != input.Name {
		if err := rewriteTodosForLabelChange(ctx, tx, label.Name, input.Name, now); err != nil {
			return Label{}, err
		}
	}

	updatedLabel, err := getLabelByID(ctx, tx, id)
	if err != nil {
		return Label{}, err
	}

	if err := tx.Commit(); err != nil {
		return Label{}, fmt.Errorf("commit update label transaction: %w", err)
	}
	committed = true

	return updatedLabel, nil
}

func (s *Store) DeleteLabel(ctx context.Context, id int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin delete label transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	label, err := getLabelByID(ctx, tx, id)
	if err != nil {
		return err
	}

	now := s.now().Format(time.RFC3339)
	if err := rewriteTodosForLabelChange(ctx, tx, label.Name, "", now); err != nil {
		return err
	}

	result, err := tx.ExecContext(ctx, `DELETE FROM labels WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete label: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted label count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrLabelNotFound
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit delete label transaction: %w", err)
	}
	committed = true
	return nil
}

func (s *Store) seedLabelsFromTodos(ctx context.Context) error {
	rows, err := s.db.QueryContext(ctx, `SELECT labels_json FROM todos`)
	if err != nil {
		return fmt.Errorf("query todo labels for seed: %w", err)
	}

	labelsToInsert := []string{}
	for rows.Next() {
		var labelsJSON string
		if err := rows.Scan(&labelsJSON); err != nil {
			_ = rows.Close()
			return fmt.Errorf("scan todo labels for seed: %w", err)
		}

		var decoded []string
		if labelsJSON != "" {
			if err := json.Unmarshal([]byte(labelsJSON), &decoded); err != nil {
				_ = rows.Close()
				return fmt.Errorf("decode todo labels for seed: %w", err)
			}
		}

		labelsToInsert = append(labelsToInsert, sanitizeLabels(decoded)...)
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		return fmt.Errorf("iterate todo labels for seed: %w", err)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close todo labels cursor for seed: %w", err)
	}

	if len(labelsToInsert) == 0 {
		return nil
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin seed labels transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	now := s.now().Format(time.RFC3339)
	if err := insertLabels(ctx, tx, labelsToInsert, now); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit seed labels transaction: %w", err)
	}
	committed = true
	return nil
}

func (s *Store) resolveLabels(ctx context.Context, tx *sql.Tx, labels []string) ([]string, error) {
	cleaned := sanitizeLabels(labels)
	if len(cleaned) == 0 {
		return []string{}, nil
	}

	resolved := make([]string, 0, len(cleaned))
	for _, label := range cleaned {
		var canonical string
		err := tx.QueryRowContext(ctx, `SELECT name FROM labels WHERE name = ?`, label).Scan(&canonical)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, &ValidationError{Message: fmt.Sprintf("labels contains unknown label: %s", label)}
		}
		if err != nil {
			return nil, fmt.Errorf("resolve label: %w", err)
		}
		resolved = append(resolved, canonical)
	}
	return resolved, nil
}

func validateLabelName(name string) error {
	if strings.TrimSpace(name) == "" {
		return &ValidationError{Message: "label name is required"}
	}
	return nil
}

func getLabelByID(ctx context.Context, tx *sql.Tx, id int64) (Label, error) {
	row := tx.QueryRowContext(
		ctx,
		`SELECT id, name, created_at, updated_at
		 FROM labels
		 WHERE id = ?`,
		id,
	)
	label, err := scanLabel(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Label{}, ErrLabelNotFound
	}
	if err != nil {
		return Label{}, err
	}
	return label, nil
}

func rewriteTodosForLabelChange(ctx context.Context, tx *sql.Tx, oldName, newName, updatedAt string) error {
	rows, err := tx.QueryContext(
		ctx,
		`SELECT id, labels_json
		 FROM todos`,
	)
	if err != nil {
		return fmt.Errorf("query todos for label update: %w", err)
	}

	type todoLabelUpdate struct {
		id     int64
		labels []string
	}

	updates := []todoLabelUpdate{}
	for rows.Next() {
		var (
			id         int64
			labelsJSON string
		)
		if err := rows.Scan(&id, &labelsJSON); err != nil {
			_ = rows.Close()
			return fmt.Errorf("scan todo labels for label update: %w", err)
		}

		var decoded []string
		if labelsJSON != "" {
			if err := json.Unmarshal([]byte(labelsJSON), &decoded); err != nil {
				_ = rows.Close()
				return fmt.Errorf("decode todo labels for label update: %w", err)
			}
		}

		rewritten, changed := rewriteLabelList(decoded, oldName, newName)
		if changed {
			updates = append(updates, todoLabelUpdate{id: id, labels: rewritten})
		}
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		return fmt.Errorf("iterate todos for label update: %w", err)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close todos cursor for label update: %w", err)
	}

	for _, update := range updates {
		labelsJSON, err := json.Marshal(update.labels)
		if err != nil {
			return fmt.Errorf("encode rewritten todo labels: %w", err)
		}
		if _, err := tx.ExecContext(
			ctx,
			`UPDATE todos
			 SET labels_json = ?, updated_at = ?
			 WHERE id = ?`,
			string(labelsJSON),
			updatedAt,
			update.id,
		); err != nil {
			return fmt.Errorf("update todo labels after label mutation: %w", err)
		}
	}

	return nil
}

func rewriteLabelList(labels []string, oldName, newName string) ([]string, bool) {
	rewritten := make([]string, 0, len(labels))
	changed := false
	for _, label := range sanitizeLabels(labels) {
		switch {
		case label != oldName:
			rewritten = append(rewritten, label)
		case newName == "":
			changed = true
		case newName != oldName:
			rewritten = append(rewritten, newName)
			changed = true
		default:
			rewritten = append(rewritten, label)
		}
	}
	rewritten = sanitizeLabels(rewritten)
	if len(rewritten) != len(sanitizeLabels(labels)) {
		changed = true
	}
	return rewritten, changed
}

func insertLabels(ctx context.Context, execer interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}, labels []string, now string) error {
	for _, label := range labels {
		if _, err := execer.ExecContext(
			ctx,
			`INSERT OR IGNORE INTO labels (name, created_at, updated_at)
			 VALUES (?, ?, ?)`,
			label,
			now,
			now,
		); err != nil {
			return fmt.Errorf("seed label: %w", err)
		}
	}
	return nil
}

func isUniqueLabelConstraint(err error) bool {
	var sqliteErr sqlite3.Error
	return errors.As(err, &sqliteErr) && sqliteErr.ExtendedCode == sqlite3.ErrConstraintUnique
}

type labelScanner interface {
	Scan(dest ...any) error
}

func scanLabel(s labelScanner) (Label, error) {
	var label Label
	if err := s.Scan(&label.ID, &label.Name, &label.CreatedAt, &label.UpdatedAt); err != nil {
		return Label{}, err
	}
	return label, nil
}

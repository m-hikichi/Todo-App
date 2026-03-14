package todo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	sqlite3 "github.com/mattn/go-sqlite3"
)

var ErrProjectNotFound = errors.New("project not found")

type Project struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateProjectInput struct {
	Name string `json:"name"`
}

type UpdateProjectInput struct {
	Name string `json:"name"`
}

func (s *Store) ListProjects(ctx context.Context) ([]Project, error) {
	rows, err := s.db.QueryContext(
		ctx,
		`SELECT id, name, created_at, updated_at
		 FROM projects
		 ORDER BY name COLLATE NOCASE ASC, id ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		project, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		projects = append(projects, project)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate projects: %w", err)
	}

	return projects, nil
}

func (s *Store) CreateProject(ctx context.Context, input CreateProjectInput) (Project, error) {
	input.Name = strings.TrimSpace(input.Name)
	if err := validateProjectName(input.Name); err != nil {
		return Project{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Project{}, fmt.Errorf("begin create project transaction: %w", err)
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
		`INSERT INTO projects (name, created_at, updated_at)
		 VALUES (?, ?, ?)`,
		input.Name,
		now,
		now,
	)
	if err != nil {
		if isUniqueProjectConstraint(err) {
			return Project{}, &ValidationError{Message: "project already exists"}
		}
		return Project{}, fmt.Errorf("insert project: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return Project{}, fmt.Errorf("get inserted project id: %w", err)
	}

	project, err := getProjectByID(ctx, tx, id)
	if err != nil {
		return Project{}, err
	}

	if err := tx.Commit(); err != nil {
		return Project{}, fmt.Errorf("commit create project transaction: %w", err)
	}
	committed = true

	return project, nil
}

func (s *Store) UpdateProject(ctx context.Context, id int64, input UpdateProjectInput) (Project, error) {
	input.Name = strings.TrimSpace(input.Name)
	if err := validateProjectName(input.Name); err != nil {
		return Project{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Project{}, fmt.Errorf("begin update project transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if _, err := getProjectByID(ctx, tx, id); err != nil {
		return Project{}, err
	}

	now := s.now().Format(time.RFC3339)
	_, err = tx.ExecContext(
		ctx,
		`UPDATE projects
		 SET name = ?, updated_at = ?
		 WHERE id = ?`,
		input.Name,
		now,
		id,
	)
	if err != nil {
		if isUniqueProjectConstraint(err) {
			return Project{}, &ValidationError{Message: "project already exists"}
		}
		return Project{}, fmt.Errorf("update project: %w", err)
	}

	updatedProject, err := getProjectByID(ctx, tx, id)
	if err != nil {
		return Project{}, err
	}

	if err := tx.Commit(); err != nil {
		return Project{}, fmt.Errorf("commit update project transaction: %w", err)
	}
	committed = true

	return updatedProject, nil
}

func (s *Store) DeleteProject(ctx context.Context, id int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin delete project transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if _, err := getProjectByID(ctx, tx, id); err != nil {
		return err
	}

	now := s.now().Format(time.RFC3339)
	if _, err := tx.ExecContext(
		ctx,
		`UPDATE todos
		 SET project_id = NULL, updated_at = ?
		 WHERE project_id = ?`,
		now,
		id,
	); err != nil {
		return fmt.Errorf("clear project reference from todos: %w", err)
	}

	result, err := tx.ExecContext(ctx, `DELETE FROM projects WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete project: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted project count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrProjectNotFound
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit delete project transaction: %w", err)
	}
	committed = true
	return nil
}

func ensureProjectReference(ctx context.Context, tx *sql.Tx, projectID *int64) error {
	if projectID == nil {
		return nil
	}
	return ensureProjectExists(ctx, tx, *projectID)
}

func ensureProjectExists(ctx context.Context, tx *sql.Tx, id int64) error {
	var exists int
	err := tx.QueryRowContext(ctx, `SELECT 1 FROM projects WHERE id = ?`, id).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return &ValidationError{Message: "project_id was not found"}
	}
	if err != nil {
		return fmt.Errorf("check project existence: %w", err)
	}
	return nil
}

func validateProjectName(name string) error {
	if strings.TrimSpace(name) == "" {
		return &ValidationError{Message: "project name is required"}
	}
	return nil
}

func getProjectByID(ctx context.Context, tx *sql.Tx, id int64) (Project, error) {
	row := tx.QueryRowContext(
		ctx,
		`SELECT id, name, created_at, updated_at
		 FROM projects
		 WHERE id = ?`,
		id,
	)
	project, err := scanProject(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Project{}, ErrProjectNotFound
	}
	if err != nil {
		return Project{}, err
	}
	return project, nil
}

func isUniqueProjectConstraint(err error) bool {
	var sqliteErr sqlite3.Error
	return errors.As(err, &sqliteErr) && sqliteErr.ExtendedCode == sqlite3.ErrConstraintUnique
}

type projectScanner interface {
	Scan(dest ...any) error
}

func scanProject(s projectScanner) (Project, error) {
	var project Project
	if err := s.Scan(&project.ID, &project.Name, &project.CreatedAt, &project.UpdatedAt); err != nil {
		return Project{}, err
	}
	return project, nil
}

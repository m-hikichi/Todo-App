package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"todo_app/internal/todo"
)

type todoAPI struct {
	store *todo.Store
}

func (a *todoAPI) handleTodos(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		todos, err := a.store.ListTodos(r.Context(), r.URL.Query().Get("status"))
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, todos)
	case http.MethodPost:
		var input todo.CreateInput
		if err := decodeJSON(r, &input); err != nil {
			writeError(w, err)
			return
		}

		created, err := a.store.CreateTodo(r.Context(), input)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, created)
	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *todoAPI) handleLabels(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		labels, err := a.store.ListLabels(r.Context())
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, labels)
	case http.MethodPost:
		var input todo.CreateLabelInput
		if err := decodeJSON(r, &input); err != nil {
			writeError(w, err)
			return
		}

		created, err := a.store.CreateLabel(r.Context(), input)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, created)
	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *todoAPI) handleLabelByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parseResourceID(r.URL.Path, "/api/labels/")
	if !ok {
		http.NotFound(w, r)
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var input todo.UpdateLabelInput
		if err := decodeJSON(r, &input); err != nil {
			writeError(w, err)
			return
		}

		updated, err := a.store.UpdateLabel(r.Context(), id, input)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := a.store.DeleteLabel(r.Context(), id); err != nil {
			writeError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.Header().Set("Allow", "PATCH, DELETE")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *todoAPI) handleTodoByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parseResourceID(r.URL.Path, "/api/todos/")
	if !ok {
		http.NotFound(w, r)
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var input todo.UpdateInput
		if err := decodeJSON(r, &input); err != nil {
			writeError(w, err)
			return
		}

		updated, err := a.store.UpdateTodo(r.Context(), id, input)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := a.store.DeleteTodo(r.Context(), id); err != nil {
			writeError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.Header().Set("Allow", "PATCH, DELETE")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func parseResourceID(path, prefix string) (int64, bool) {
	idPart := strings.TrimPrefix(path, prefix)
	if idPart == "" || strings.Contains(idPart, "/") {
		return 0, false
	}

	id, err := strconv.ParseInt(idPart, 10, 64)
	if err != nil {
		return 0, false
	}
	return id, true
}

func decodeJSON(r *http.Request, dest any) error {
	if r.Body == nil {
		return errors.New("request body is required")
	}

	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dest); err != nil {
		return err
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, todo.ErrNotFound):
		http.Error(w, "todo not found", http.StatusNotFound)
	case errors.Is(err, todo.ErrLabelNotFound):
		http.Error(w, "label not found", http.StatusNotFound)
	case todo.IsValidationError(err):
		http.Error(w, err.Error(), http.StatusBadRequest)
	default:
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}
}

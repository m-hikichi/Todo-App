package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"todo_app/internal/todo"
)

func main() {
	hostFlag := flag.String("host", envOrDefault("APP_HOST", "127.0.0.1"), "bind host")
	portFlag := flag.String("port", envOrDefault("APP_PORT", "8080"), "bind port")
	dataDirFlag := flag.String("data-dir", envOrDefault("APP_DATA_DIR", "data"), "sqlite data directory")
	flag.Parse()

	store, err := todo.Open(*dataDirFlag)
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if closeErr := store.Close(); closeErr != nil {
			log.Printf("failed to close sqlite db: %v", closeErr)
		}
	}()

	addr := *hostFlag + ":" + *portFlag

	mux := http.NewServeMux()
	api := &todoAPI{store: store}

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/api/labels", api.handleLabels)
	mux.HandleFunc("/api/labels/", api.handleLabelByID)
	mux.HandleFunc("/api/todos", api.handleTodos)
	mux.HandleFunc("/api/todos/", api.handleTodoByID)

	fileServer := http.FileServer(http.Dir("web"))
	mux.Handle("/", fileServer)

	log.Printf("todo_app server listening on http://%s (mode=web sqlite=%s)", addr, store.Path())
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

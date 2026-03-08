package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	host := envOrDefault("APP_HOST", "127.0.0.1")
	port := envOrDefault("APP_PORT", "8080")
	addr := host + ":" + port

	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	fileServer := http.FileServer(http.Dir("web"))
	mux.Handle("/", fileServer)

	log.Printf("todo_app server listening on http://%s", addr)
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

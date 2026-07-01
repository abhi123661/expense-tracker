package handler

import (
	"encoding/json"
	"net/http"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Server holds shared dependencies for all handlers
type Server struct {
	queries   *store.Queries
	pool      *pgxpool.Pool
	JWTSecret []byte
}

// NewServer creates a new Server with database access
func NewServer(pool *pgxpool.Pool, jwtSecret string) *Server {
	return &Server{
		queries:   store.New(pool),
		pool:      pool,
		JWTSecret: []byte(jwtSecret),
	}
}

// Helper: send JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Helper: send error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// Helper: decode JSON request body
func decodeJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

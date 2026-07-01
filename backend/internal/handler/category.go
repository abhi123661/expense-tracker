package handler

import (
	"net/http"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListCategories returns all categories
func (s *Server) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := s.queries.ListCategories(r.Context(), GetUserID(r.Context()))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	respondJSON(w, http.StatusOK, categories)
}

// CreateCategory creates a new custom category
func (s *Server) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Icon  string `json:"icon"`
		Color string `json:"color"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	category, err := s.queries.CreateCategory(r.Context(), store.CreateCategoryParams{
		Name:   req.Name,
		Icon:   pgtype.Text{String: req.Icon, Valid: req.Icon != ""},
		Color:  pgtype.Text{String: req.Color, Valid: req.Color != ""},
		UserID: GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create category")
		return
	}
	respondJSON(w, http.StatusCreated, category)
}

// UpdateCategory updates a custom category
func (s *Server) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req struct {
		Name  string `json:"name"`
		Icon  string `json:"icon"`
		Color string `json:"color"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	category, err := s.queries.UpdateCategory(r.Context(), store.UpdateCategoryParams{
		Name:   req.Name,
		Icon:   pgtype.Text{String: req.Icon, Valid: req.Icon != ""},
		Color:  pgtype.Text{String: req.Color, Valid: req.Color != ""},
		ID:     uuid,
		UserID: GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "Category not found or is a default category")
		return
	}
	respondJSON(w, http.StatusOK, category)
}

// DeleteCategory deletes a custom category
func (s *Server) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	err = s.queries.DeleteCategory(r.Context(), store.DeleteCategoryParams{
		ID:     uuid,
		UserID: GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete category (may have linked expenses)")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Category deleted"})
}

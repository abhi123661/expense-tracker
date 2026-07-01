package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListRecurring returns all recurring expenses
func (s *Server) ListRecurring(w http.ResponseWriter, r *http.Request) {
	recurring, err := s.queries.ListRecurring(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch recurring expenses")
		return
	}
	respondJSON(w, http.StatusOK, recurring)
}

// CreateRecurring creates a new recurring expense
func (s *Server) CreateRecurring(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		Note       string  `json:"note"`
		CategoryID string  `json:"category_id"`
		Frequency  string  `json:"frequency"` // "monthly" or "weekly"
		NextDate   string  `json:"next_date"` // YYYY-MM-DD
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	if req.CategoryID == "" {
		respondError(w, http.StatusBadRequest, "Category ID is required")
		return
	}
	if req.Frequency != "monthly" && req.Frequency != "weekly" {
		respondError(w, http.StatusBadRequest, "Frequency must be 'monthly' or 'weekly'")
		return
	}
	if req.Currency == "" {
		req.Currency = "INR"
	}

	categoryUUID, err := parseUUID(req.CategoryID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var nextDate pgtype.Date
	if req.NextDate != "" {
		t, err := time.Parse("2006-01-02", req.NextDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM-DD)")
			return
		}
		nextDate = pgtype.Date{Time: t, Valid: true}
	} else {
		// Default to first of next month for monthly, next week for weekly
		now := time.Now()
		if req.Frequency == "monthly" {
			nextDate = pgtype.Date{Time: time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC), Valid: true}
		} else {
			nextDate = pgtype.Date{Time: now.AddDate(0, 0, 7), Valid: true}
		}
	}

	recurring, err := s.queries.CreateRecurring(r.Context(), store.CreateRecurringParams{
		Amount:     numericFromFloat(req.Amount),
		Currency:   req.Currency,
		Note:       pgtype.Text{String: req.Note, Valid: req.Note != ""},
		CategoryID: categoryUUID,
		Frequency:  req.Frequency,
		NextDate:   nextDate,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create recurring expense: %v", err))
		return
	}
	respondJSON(w, http.StatusCreated, recurring)
}

// UpdateRecurring updates a recurring expense
func (s *Server) UpdateRecurring(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid recurring expense ID")
		return
	}

	var req struct {
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		Note       string  `json:"note"`
		CategoryID string  `json:"category_id"`
		Frequency  string  `json:"frequency"`
		NextDate   string  `json:"next_date"`
		Active     bool    `json:"active"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	if req.CategoryID == "" {
		respondError(w, http.StatusBadRequest, "Category ID is required")
		return
	}
	if req.Currency == "" {
		req.Currency = "INR"
	}

	categoryUUID, err := parseUUID(req.CategoryID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	nextDate, err := time.Parse("2006-01-02", req.NextDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM-DD)")
		return
	}

	recurring, err := s.queries.UpdateRecurring(r.Context(), store.UpdateRecurringParams{
		Amount:     numericFromFloat(req.Amount),
		Currency:   req.Currency,
		Note:       pgtype.Text{String: req.Note, Valid: req.Note != ""},
		CategoryID: categoryUUID,
		Frequency:  req.Frequency,
		NextDate:   pgtype.Date{Time: nextDate, Valid: true},
		Active:     pgtype.Bool{Bool: req.Active, Valid: true},
		ID:         uuid,
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "Recurring expense not found")
		return
	}
	respondJSON(w, http.StatusOK, recurring)
}

// DeleteRecurring deletes a recurring expense
func (s *Server) DeleteRecurring(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid recurring expense ID")
		return
	}

	err = s.queries.DeleteRecurring(r.Context(), uuid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete recurring expense")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Recurring expense deleted"})
}

// ProcessRecurring checks for due recurring expenses and creates them
func (s *Server) ProcessRecurring(w http.ResponseWriter, r *http.Request) {
	today := time.Now()
	due, err := s.queries.GetDueRecurring(r.Context(), pgtype.Date{Time: today, Valid: true})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch due recurring expenses")
		return
	}

	created := 0
	for _, d := range due {
		// Create the expense
		_, err := s.queries.CreateExpense(r.Context(), store.CreateExpenseParams{
			Amount:     d.Amount,
			Currency:   d.Currency,
			Note:       d.Note,
			CategoryID: d.CategoryID,
			Date:       pgtype.Date{Time: today, Valid: true},
		})
		if err != nil {
			continue
		}

		// Advance next_date
		var nextDate time.Time
		if d.Frequency == "monthly" {
			nextDate = d.NextDate.Time.AddDate(0, 1, 0)
		} else {
			nextDate = d.NextDate.Time.AddDate(0, 0, 7)
		}

		s.queries.UpdateRecurring(r.Context(), store.UpdateRecurringParams{
			Amount:     d.Amount,
			Currency:   d.Currency,
			Note:       d.Note,
			CategoryID: d.CategoryID,
			Frequency:  d.Frequency,
			NextDate:   pgtype.Date{Time: nextDate, Valid: true},
			Active:     d.Active,
			ID:         d.ID,
		})
		created++
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("Processed %d recurring expenses", created),
		"created": created,
	})
}

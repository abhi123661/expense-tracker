package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListBudgets returns all budgets with spent amounts
func (s *Server) ListBudgets(w http.ResponseWriter, r *http.Request) {
	budgets, err := s.queries.ListBudgets(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch budgets")
		return
	}

	// Calculate spent amount for each budget
	type BudgetWithSpent struct {
		store.ListBudgetsRow
		Spent      pgtype.Numeric `json:"spent"`
		Percentage float64        `json:"percentage"`
	}

	now := time.Now()
	var results []BudgetWithSpent

	for _, b := range budgets {
		var startDate, endDate time.Time
		if b.Period == "monthly" {
			startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
			endDate = startDate.AddDate(0, 1, -1)
		} else { // weekly
			weekday := int(now.Weekday())
			if weekday == 0 {
				weekday = 7
			}
			startDate = now.AddDate(0, 0, -weekday+1)
			endDate = startDate.AddDate(0, 0, 6)
		}

		spent, err := s.queries.GetBudgetSpent(r.Context(), store.GetBudgetSpentParams{
			CategoryID: b.CategoryID,
			Date:       pgtype.Date{Time: startDate, Valid: true},
			Date_2:     pgtype.Date{Time: endDate, Valid: true},
		})
		if err != nil {
			spent = pgtype.Numeric{Int: nil, Valid: true}
		}

		// Calculate percentage
		var pct float64
		if b.Amount.Valid && spent.Valid && b.Amount.Int != nil && b.Amount.Int.Sign() > 0 {
			budgetFloat, _ := numericToFloat(b.Amount)
			spentFloat, _ := numericToFloat(spent)
			if budgetFloat > 0 {
				pct = (spentFloat / budgetFloat) * 100
			}
		}

		results = append(results, BudgetWithSpent{
			ListBudgetsRow: b,
			Spent:          spent,
			Percentage:     pct,
		})
	}

	respondJSON(w, http.StatusOK, results)
}

// CreateBudget creates or updates a budget for a category
func (s *Server) CreateBudget(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CategoryID string  `json:"category_id"`
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		Period     string  `json:"period"` // "monthly" or "weekly"
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
	if req.Period == "" {
		req.Period = "monthly"
	}
	if req.Period != "monthly" && req.Period != "weekly" {
		respondError(w, http.StatusBadRequest, "Period must be 'monthly' or 'weekly'")
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

	budget, err := s.queries.CreateBudget(r.Context(), store.CreateBudgetParams{
		CategoryID: categoryUUID,
		Amount:     numericFromFloat(req.Amount),
		Currency:   req.Currency,
		Period:     req.Period,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create budget: %v", err))
		return
	}
	respondJSON(w, http.StatusCreated, budget)
}

// DeleteBudget deletes a budget
func (s *Server) DeleteBudget(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	err = s.queries.DeleteBudget(r.Context(), uuid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete budget")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Budget deleted"})
}

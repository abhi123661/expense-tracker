package handler

import (
	"fmt"
	"math"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateExpense creates a new expense
func (s *Server) CreateExpense(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		Note       string  `json:"note"`
		CategoryID string  `json:"category_id"`
		Date       string  `json:"date"` // format: YYYY-MM-DD
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validation
	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Amount must be greater than 0")
		return
	}
	if req.CategoryID == "" {
		respondError(w, http.StatusBadRequest, "Category ID is required")
		return
	}

	categoryUUID, err := parseUUID(req.CategoryID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	// Default currency to INR
	if req.Currency == "" {
		req.Currency = "INR"
	}

	// Parse date (default to today)
	var date pgtype.Date
	if req.Date != "" {
		t, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM-DD)")
			return
		}
		date = pgtype.Date{Time: t, Valid: true}
	} else {
		date = pgtype.Date{Time: time.Now(), Valid: true}
	}

	expense, err := s.queries.CreateExpense(r.Context(), store.CreateExpenseParams{
		Amount:     numericFromFloat(req.Amount),
		Currency:   req.Currency,
		Note:       pgtype.Text{String: req.Note, Valid: req.Note != ""},
		CategoryID: categoryUUID,
		Date:       date,
		UserID:     GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create expense: %v", err))
		return
	}
	respondJSON(w, http.StatusCreated, expense)
}

// GetExpense returns a single expense by ID
func (s *Server) GetExpense(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}

	expense, err := s.queries.GetExpense(r.Context(), store.GetExpenseParams{
		ID:     uuid,
		UserID: GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "Expense not found")
		return
	}
	respondJSON(w, http.StatusOK, expense)
}

// UpdateExpense updates an existing expense
func (s *Server) UpdateExpense(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}

	var req struct {
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		Note       string  `json:"note"`
		CategoryID string  `json:"category_id"`
		Date       string  `json:"date"`
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

	categoryUUID, err := parseUUID(req.CategoryID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	if req.Currency == "" {
		req.Currency = "INR"
	}

	var date pgtype.Date
	if req.Date != "" {
		t, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM-DD)")
			return
		}
		date = pgtype.Date{Time: t, Valid: true}
	} else {
		date = pgtype.Date{Time: time.Now(), Valid: true}
	}

	expense, err := s.queries.UpdateExpense(r.Context(), store.UpdateExpenseParams{
		Amount:     numericFromFloat(req.Amount),
		Currency:   req.Currency,
		Note:       pgtype.Text{String: req.Note, Valid: req.Note != ""},
		CategoryID: categoryUUID,
		Date:       date,
		ID:         uuid,
		UserID:     GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "Expense not found")
		return
	}
	respondJSON(w, http.StatusOK, expense)
}

// DeleteExpense deletes an expense
func (s *Server) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uuid, err := parseUUID(id)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid expense ID")
		return
	}

	err = s.queries.DeleteExpense(r.Context(), store.DeleteExpenseParams{
		ID:     uuid,
		UserID: GetUserID(r.Context()),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete expense")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Expense deleted"})
}

// ListExpenses returns expenses with optional filters
func (s *Server) ListExpenses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	// Parse pagination
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Build filter params
	userID := GetUserID(r.Context())
	params := store.ListExpensesParams{
		UserID:      userID,
		QueryLimit:  int32(limit),
		QueryOffset: int32(offset),
	}

	// Date filters
	if from := q.Get("from"); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err == nil {
			params.FromDate = pgtype.Date{Time: t, Valid: true}
		}
	}
	if to := q.Get("to"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err == nil {
			params.ToDate = pgtype.Date{Time: t, Valid: true}
		}
	}

	// Category filter
	if catID := q.Get("category_id"); catID != "" {
		uuid, err := parseUUID(catID)
		if err == nil {
			params.CategoryID = uuid
		}
	}

	// Amount filters
	if minAmt := q.Get("min_amount"); minAmt != "" {
		if val, err := strconv.ParseFloat(minAmt, 64); err == nil {
			params.MinAmount = numericFromFloat(val)
		}
	}
	if maxAmt := q.Get("max_amount"); maxAmt != "" {
		if val, err := strconv.ParseFloat(maxAmt, 64); err == nil {
			params.MaxAmount = numericFromFloat(val)
		}
	}

	// Search filter
	if search := q.Get("search"); search != "" {
		params.Search = pgtype.Text{String: search, Valid: true}
	}

	// Get expenses
	expenses, err := s.queries.ListExpenses(r.Context(), params)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to fetch expenses: %v", err))
		return
	}

	// Get total count for pagination
	countParams := store.CountExpensesParams{
		UserID:     userID,
		FromDate:   params.FromDate,
		ToDate:     params.ToDate,
		CategoryID: params.CategoryID,
		MinAmount:  params.MinAmount,
		MaxAmount:  params.MaxAmount,
		Search:     params.Search,
	}
	total, err := s.queries.CountExpenses(r.Context(), countParams)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to count expenses")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"expenses": expenses,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// numericFromFloat converts a float64 to pgtype.Numeric
func numericFromFloat(f float64) pgtype.Numeric {
	// Convert to cents (2 decimal places) to avoid floating point issues
	cents := int64(math.Round(f * 100))
	var num pgtype.Numeric
	num.Int = big.NewInt(cents)
	num.Exp = -2
	num.Valid = true
	return num
}

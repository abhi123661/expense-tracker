package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/jackc/pgx/v5/pgtype"
)

// ExportExpenses exports expenses as CSV
func (s *Server) ExportExpenses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	// Build filter params (same as ListExpenses but without pagination limit)
	params := store.ListExpensesParams{
		UserID:      GetUserID(r.Context()),
		QueryLimit:  10000, // Export all (reasonable cap)
		QueryOffset: 0,
	}

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
	if catID := q.Get("category_id"); catID != "" {
		uuid, err := parseUUID(catID)
		if err == nil {
			params.CategoryID = uuid
		}
	}

	expenses, err := s.queries.ListExpenses(r.Context(), params)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch expenses")
		return
	}

	// Set CSV headers
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=expenses_%s.csv", time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header row
	writer.Write([]string{"Date", "Category", "Amount", "Currency", "Note"})

	// Write data rows
	for _, e := range expenses {
		amount, _ := numericToFloat(e.Amount)
		note := ""
		if e.Note.Valid {
			note = e.Note.String
		}
		writer.Write([]string{
			e.Date.Time.Format("2006-01-02"),
			e.CategoryName,
			fmt.Sprintf("%.2f", amount),
			e.Currency,
			note,
		})
	}
}

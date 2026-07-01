package handler

import (
	"net/http"
	"time"

	"github.com/expense-tracker/backend/internal/store"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetSummary returns spending summary for a given period
func (s *Server) GetSummary(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	period := q.Get("period") // "monthly" or "weekly"
	dateStr := q.Get("date")  // "2026-07" for monthly, "2026-07-01" for weekly

	if period == "" {
		period = "monthly"
	}

	var startDate, endDate time.Time
	now := time.Now()

	switch period {
	case "weekly":
		if dateStr != "" {
			t, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM-DD for weekly)")
				return
			}
			// Start from the given date's Monday
			weekday := int(t.Weekday())
			if weekday == 0 {
				weekday = 7
			}
			startDate = t.AddDate(0, 0, -weekday+1)
		} else {
			weekday := int(now.Weekday())
			if weekday == 0 {
				weekday = 7
			}
			startDate = now.AddDate(0, 0, -weekday+1)
		}
		endDate = startDate.AddDate(0, 0, 6)
	default: // monthly
		if dateStr != "" {
			t, err := time.Parse("2006-01", dateStr)
			if err != nil {
				respondError(w, http.StatusBadRequest, "Invalid date format (use YYYY-MM for monthly)")
				return
			}
			startDate = t
		} else {
			startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		}
		endDate = startDate.AddDate(0, 1, -1)
	}

	start := pgtype.Date{Time: startDate, Valid: true}
	end := pgtype.Date{Time: endDate, Valid: true}

	// Get overall summary
	userID := GetUserID(r.Context())
	summary, err := s.queries.GetMonthlySummary(r.Context(), store.GetMonthlySummaryParams{
		UserID: userID,
		Date:   start,
		Date_2: end,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch summary")
		return
	}

	// Get category breakdown
	categories, err := s.queries.GetCategorySummary(r.Context(), store.GetCategorySummaryParams{
		UserID: userID,
		Date:   start,
		Date_2: end,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch category summary")
		return
	}

	// Get daily spending
	daily, err := s.queries.GetDailySpending(r.Context(), store.GetDailySpendingParams{
		UserID: userID,
		Date:   start,
		Date_2: end,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch daily spending")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"period":     period,
		"start_date": startDate.Format("2006-01-02"),
		"end_date":   endDate.Format("2006-01-02"),
		"summary":    summary,
		"categories": categories,
		"daily":      daily,
	})
}

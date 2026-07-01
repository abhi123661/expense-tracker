package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/expense-tracker/backend/internal/handler"
)

func main() {
	// Load .env file (ignore error if not present, e.g. in production)
	_ = godotenv.Load()

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Connect to PostgreSQL
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	// Verify connection
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}
	log.Println("Connected to database")

	// Set up router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)    // Log every request
	r.Use(chimiddleware.Recoverer) // Recover from panics
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "https://*.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Initialize handlers
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-change-in-production"
	}
	srv := handler.NewServer(pool, jwtSecret)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Public auth routes (no middleware)
		r.Post("/auth/signup", srv.Signup)
		r.Post("/auth/login", srv.Login)

		// Protected routes (require JWT)
		r.Group(func(r chi.Router) {
			r.Use(srv.AuthMiddleware)

			// Categories
			r.Get("/categories", srv.ListCategories)
			r.Post("/categories", srv.CreateCategory)
			r.Put("/categories/{id}", srv.UpdateCategory)
			r.Delete("/categories/{id}", srv.DeleteCategory)

			// Expenses
			r.Post("/expenses", srv.CreateExpense)
			r.Get("/expenses", srv.ListExpenses)
			r.Get("/expenses/export", srv.ExportExpenses)
			r.Get("/expenses/{id}", srv.GetExpense)
			r.Put("/expenses/{id}", srv.UpdateExpense)
			r.Delete("/expenses/{id}", srv.DeleteExpense)

			// Budgets
			r.Get("/budgets", srv.ListBudgets)
			r.Post("/budgets", srv.CreateBudget)
			r.Delete("/budgets/{id}", srv.DeleteBudget)

			// Recurring expenses
			r.Get("/recurring", srv.ListRecurring)
			r.Post("/recurring", srv.CreateRecurring)
			r.Put("/recurring/{id}", srv.UpdateRecurring)
			r.Delete("/recurring/{id}", srv.DeleteRecurring)
			r.Post("/recurring/process", srv.ProcessRecurring)

			// Summary/Dashboard
			r.Get("/summary", srv.GetSummary)
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

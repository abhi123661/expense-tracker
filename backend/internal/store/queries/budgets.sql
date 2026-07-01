-- name: CreateBudget :one
INSERT INTO budgets (category_id, amount, currency, period)
VALUES ($1, $2, $3, $4)
ON CONFLICT (category_id, period)
DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency, updated_at = NOW()
RETURNING *;

-- name: ListBudgets :many
SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
FROM budgets b
JOIN categories c ON b.category_id = c.id
ORDER BY c.name;

-- name: DeleteBudget :exec
DELETE FROM budgets WHERE id = $1;

-- name: GetBudgetSpent :one
SELECT COALESCE(SUM(e.amount), 0)::decimal as spent
FROM expenses e
WHERE e.category_id = $1
    AND e.date >= $2
    AND e.date <= $3;

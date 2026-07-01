-- name: CreateBudget :one
INSERT INTO budgets (category_id, amount, currency, period, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListBudgets :many
SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
FROM budgets b
JOIN categories c ON b.category_id = c.id
WHERE b.user_id = $1
ORDER BY c.name;

-- name: DeleteBudget :exec
DELETE FROM budgets WHERE id = $1 AND user_id = $2;

-- name: GetBudgetSpent :one
SELECT COALESCE(SUM(e.amount), 0)::decimal as spent
FROM expenses e
WHERE e.category_id = $1
    AND e.user_id = $2
    AND e.date >= $3
    AND e.date <= $4;

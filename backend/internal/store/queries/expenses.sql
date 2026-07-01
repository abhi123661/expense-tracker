-- name: CreateExpense :one
INSERT INTO expenses (amount, currency, note, category_id, date, user_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetExpense :one
SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE e.id = $1 AND e.user_id = $2;

-- name: UpdateExpense :one
UPDATE expenses
SET amount = $1, currency = $2, note = $3, category_id = $4, date = $5, updated_at = NOW()
WHERE id = $6 AND user_id = $7
RETURNING *;

-- name: DeleteExpense :exec
DELETE FROM expenses WHERE id = $1 AND user_id = $2;

-- name: ListExpenses :many
SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE
    e.user_id = sqlc.arg('user_id')::uuid
    AND (sqlc.narg('from_date')::date IS NULL OR e.date >= sqlc.narg('from_date')::date)
    AND (sqlc.narg('to_date')::date IS NULL OR e.date <= sqlc.narg('to_date')::date)
    AND (sqlc.narg('category_id')::uuid IS NULL OR e.category_id = sqlc.narg('category_id')::uuid)
    AND (sqlc.narg('min_amount')::decimal IS NULL OR e.amount >= sqlc.narg('min_amount')::decimal)
    AND (sqlc.narg('max_amount')::decimal IS NULL OR e.amount <= sqlc.narg('max_amount')::decimal)
    AND (sqlc.narg('search')::text IS NULL OR e.note ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY e.date DESC, e.created_at DESC
LIMIT sqlc.arg('query_limit')::int
OFFSET sqlc.arg('query_offset')::int;

-- name: CountExpenses :one
SELECT COUNT(*) FROM expenses e
WHERE
    e.user_id = sqlc.arg('user_id')::uuid
    AND (sqlc.narg('from_date')::date IS NULL OR e.date >= sqlc.narg('from_date')::date)
    AND (sqlc.narg('to_date')::date IS NULL OR e.date <= sqlc.narg('to_date')::date)
    AND (sqlc.narg('category_id')::uuid IS NULL OR e.category_id = sqlc.narg('category_id')::uuid)
    AND (sqlc.narg('min_amount')::decimal IS NULL OR e.amount >= sqlc.narg('min_amount')::decimal)
    AND (sqlc.narg('max_amount')::decimal IS NULL OR e.amount <= sqlc.narg('max_amount')::decimal)
    AND (sqlc.narg('search')::text IS NULL OR e.note ILIKE '%' || sqlc.narg('search')::text || '%');

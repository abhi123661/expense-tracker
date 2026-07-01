-- name: CreateRecurring :one
INSERT INTO recurring_expenses (amount, currency, note, category_id, frequency, next_date, user_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListRecurring :many
SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
FROM recurring_expenses r
JOIN categories c ON r.category_id = c.id
WHERE r.user_id = $1
ORDER BY r.next_date;

-- name: UpdateRecurring :one
UPDATE recurring_expenses
SET amount = $1, currency = $2, note = $3, category_id = $4, frequency = $5, next_date = $6, active = $7, updated_at = NOW()
WHERE id = $8 AND user_id = $9
RETURNING *;

-- name: DeleteRecurring :exec
DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2;

-- name: GetDueRecurring :many
SELECT * FROM recurring_expenses
WHERE active = true AND next_date <= $1 AND user_id = $2;

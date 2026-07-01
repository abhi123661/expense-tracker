-- name: ListCategories :many
SELECT * FROM categories
WHERE is_default = true OR user_id = $1
ORDER BY is_default DESC, name ASC;

-- name: GetCategory :one
SELECT * FROM categories WHERE id = $1;

-- name: CreateCategory :one
INSERT INTO categories (name, icon, color, is_default, user_id)
VALUES ($1, $2, $3, false, $4)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET name = $1, icon = $2, color = $3, updated_at = NOW()
WHERE id = $4 AND is_default = false AND user_id = $5
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE id = $1 AND is_default = false AND user_id = $2;

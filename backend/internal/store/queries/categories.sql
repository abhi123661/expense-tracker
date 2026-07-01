-- name: ListCategories :many
SELECT * FROM categories ORDER BY is_default DESC, name ASC;

-- name: GetCategory :one
SELECT * FROM categories WHERE id = $1;

-- name: CreateCategory :one
INSERT INTO categories (name, icon, color, is_default)
VALUES ($1, $2, $3, false)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET name = $1, icon = $2, color = $3, updated_at = NOW()
WHERE id = $4 AND is_default = false
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE id = $1 AND is_default = false;

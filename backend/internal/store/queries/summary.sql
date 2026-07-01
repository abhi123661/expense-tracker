-- name: GetMonthlySummary :one
SELECT
    COALESCE(SUM(amount), 0)::decimal as total_spent,
    COALESCE(AVG(amount), 0)::decimal as avg_expense,
    COUNT(*) as total_count
FROM expenses
WHERE user_id = $1 AND date >= $2 AND date <= $3;

-- name: GetCategorySummary :many
SELECT
    c.id as category_id,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color,
    COALESCE(SUM(e.amount), 0)::decimal as total_spent,
    COUNT(e.id) as expense_count
FROM categories c
LEFT JOIN expenses e ON c.id = e.category_id AND e.date >= $2 AND e.date <= $3 AND e.user_id = $1
WHERE (c.is_default = true OR c.user_id = $1)
GROUP BY c.id, c.name, c.icon, c.color
HAVING COUNT(e.id) > 0
ORDER BY total_spent DESC;

-- name: GetDailySpending :many
SELECT
    e.date,
    COALESCE(SUM(e.amount), 0)::decimal as total_spent
FROM expenses e
WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3
GROUP BY e.date
ORDER BY e.date;

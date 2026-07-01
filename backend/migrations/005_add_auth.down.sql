-- Remove user_id from all tables
ALTER TABLE recurring_expenses DROP COLUMN IF EXISTS user_id;
ALTER TABLE categories DROP COLUMN IF EXISTS user_id;
ALTER TABLE budgets DROP COLUMN IF EXISTS user_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS user_id;

-- Drop users table
DROP TABLE IF EXISTS users;

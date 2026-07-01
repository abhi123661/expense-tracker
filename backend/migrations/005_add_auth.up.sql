-- Create users table
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          VARCHAR(100) NOT NULL DEFAULT '',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Clear existing data (starting fresh)
DELETE FROM recurring_expenses;
DELETE FROM budgets;
DELETE FROM expenses;

-- Add user_id to expenses
ALTER TABLE expenses ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_expenses_user_id ON expenses(user_id);

-- Add user_id to budgets
ALTER TABLE budgets ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_budgets_user_id ON budgets(user_id);

-- Add user_id to categories (nullable — NULL means default/shared category)
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Add user_id to recurring_expenses
ALTER TABLE recurring_expenses ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_recurring_user_id ON recurring_expenses(user_id);

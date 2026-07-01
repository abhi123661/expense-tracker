CREATE TABLE IF NOT EXISTS recurring_expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency    VARCHAR(3) NOT NULL DEFAULT 'INR',
    note        TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    frequency   VARCHAR(10) NOT NULL CHECK (frequency IN ('monthly', 'weekly')),
    next_date   DATE NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
